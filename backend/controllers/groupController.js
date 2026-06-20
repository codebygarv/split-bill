const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// Helper to generate a unique 6-character group code
const generateGroupCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existingGroup = await Group.findOne({ code });
    if (!existingGroup) {
      isUnique = true;
    }
  }
  return code;
};

// @desc    Create a new expense group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Please provide group name and type' });
    }

    const code = await generateGroupCode();

    const group = await Group.create({
      name,
      type,
      code,
      admin: req.user._id,
      members: [req.user._id],
    });

    // Add group to creator's groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id },
    });

    // Create Notification
    await Notification.create({
      group: group._id,
      message: `${req.user.name} created the group "${name}"`,
      type: 'member_joined',
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join an existing group using group code
// @route   POST /api/groups/join
// @access  Private
const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Please enter a group code' });
    }

    const formattedCode = code.trim().toUpperCase();
    const group = await Group.findOne({ code: formattedCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found with this code' });
    }

    // Check if user is already in the group
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to group
    group.members.push(req.user._id);
    await group.save();

    // Add group to user's groups list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { groups: group._id },
    });

    // Log Notification
    await Notification.create({
      group: group._id,
      message: `${req.user.name} joined the group`,
      type: 'member_joined',
    });

    // Send push notification to other group members
    const otherMembers = group.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    sendPushNotification(
      otherMembers,
      `New Member in ${group.name}`,
      `${req.user.name} joined the group`,
      { groupId: group._id.toString() }
    );

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group details (members list)
// @route   GET /api/groups/:id
// @access  Private
const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email phone profileImage createdAt')
      .populate('admin', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user belongs to group
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group dashboard calculations & summary
// @route   GET /api/groups/:id/dashboard
// @access  Private
const getGroupDashboard = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id.toString();

    const group = await Group.findById(groupId).populate('members', 'name email profileImage');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user belongs to group
    const isMember = group.members.some(member => member._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    // 1. Get all expenses
    const expenses = await Expense.find({ group: groupId }).populate('paidBy', 'name');

    // 2. Get all completed settlements
    const settlements = await Settlement.find({ group: groupId, status: 'completed' });

    // 3. Compute general statistics
    let totalExpenses = 0;
    let thisMonthExpenses = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    expenses.forEach(exp => {
      totalExpenses += exp.amount;
      const expDate = new Date(exp.date);
      if (expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth) {
        thisMonthExpenses += exp.amount;
      }
    });

    // 4. Compute balance matrix
    // debts[A][B] = amount that A owes to B
    const debts = {};
    
    // Initialize matrices
    group.members.forEach(m1 => {
      const u1 = m1._id.toString();
      debts[u1] = {};
      group.members.forEach(m2 => {
        const u2 = m2._id.toString();
        debts[u1][u2] = 0;
      });
    });

    // Process expenses
    expenses.forEach(exp => {
      const payerId = exp.paidBy._id.toString();
      
      // Ensure payer exists in debt matrix (in case member left or is not populated properly)
      if (!debts[payerId]) return;

      exp.splitBetween.forEach(split => {
        const debtorId = split.user.toString();
        if (!debts[debtorId]) return;

        if (debtorId !== payerId) {
          debts[debtorId][payerId] += split.amount;
        }
      });
    });

    // Process settlements (subtract settled amounts)
    settlements.forEach(sett => {
      const fromId = sett.fromUser.toString();
      const toId = sett.toUser.toString();
      if (debts[fromId] && debts[fromId][toId] !== undefined) {
        debts[fromId][toId] -= sett.amount;
      }
    });

    // Compute pairwise net debts
    // netDebts[A][B] = net amount A owes B (A owes B, B owes A netted)
    const netDebts = {};
    group.members.forEach(m1 => {
      const u1 = m1._id.toString();
      netDebts[u1] = {};
    });

    const memberIds = group.members.map(m => m._id.toString());
    for (let i = 0; i < memberIds.length; i++) {
      const u1 = memberIds[i];
      for (let j = i + 1; j < memberIds.length; j++) {
        const u2 = memberIds[j];
        
        const u1OwesU2 = debts[u1][u2] || 0;
        const u2OwesU1 = debts[u2][u1] || 0;

        if (u1OwesU2 > u2OwesU1) {
          netDebts[u1][u2] = u1OwesU2 - u2OwesU1;
          netDebts[u2][u1] = 0;
        } else if (u2OwesU1 > u1OwesU2) {
          netDebts[u2][u1] = u2OwesU1 - u1OwesU2;
          netDebts[u1][u2] = 0;
        } else {
          netDebts[u1][u2] = 0;
          netDebts[u2][u1] = 0;
        }
      }
    }

    // Compile active user's balances
    let youOwe = 0;
    let youAreOwed = 0;
    const owesList = [];
    const owedList = [];

    group.members.forEach(member => {
      const peerId = member._id.toString();
      if (peerId === userId) return;

      const userOwesPeer = netDebts[userId][peerId] || 0;
      const peerOwesUser = netDebts[peerId][userId] || 0;

      if (userOwesPeer > 0.01) {
        youOwe += userOwesPeer;
        owesList.push({
          user: {
            _id: member._id,
            name: member.name,
            profileImage: member.profileImage,
          },
          amount: Math.round(userOwesPeer * 100) / 100,
        });
      }

      if (peerOwesUser > 0.01) {
        youAreOwed += peerOwesUser;
        owedList.push({
          user: {
            _id: member._id,
            name: member.name,
            profileImage: member.profileImage,
          },
          amount: Math.round(peerOwesUser * 100) / 100,
        });
      }
    });

    // Generate balance breakdown for active user
    const balanceBreakdown = [];
    expenses.forEach(exp => {
      const payerId = exp.paidBy._id.toString();
      exp.splitBetween.forEach(split => {
        const debtorId = split.user.toString();
        if (debtorId !== payerId) {
           if (payerId === userId) {
              const debtor = group.members.find(m => m._id.toString() === debtorId);
              balanceBreakdown.push({
                 type: 'you_are_owed',
                 amount: split.amount,
                 date: exp.date,
                 message: `${debtor?.name} owes you ₹${split.amount} for ${exp.category} ${exp.notes ? `(${exp.notes})` : ''}`.trim()
              });
           } else if (debtorId === userId) {
              const payer = group.members.find(m => m._id.toString() === payerId);
              balanceBreakdown.push({
                 type: 'you_owe',
                 amount: split.amount,
                 date: exp.date,
                 message: `You owe ${payer?.name || exp.paidBy.name} ₹${split.amount} for ${exp.category} ${exp.notes ? `(${exp.notes})` : ''}`.trim()
              });
           }
        }
      });
    });

    settlements.forEach(sett => {
       const fromId = sett.fromUser.toString();
       const toId = sett.toUser.toString();
       if (fromId === userId) {
          const toUser = group.members.find(m => m._id.toString() === toId);
          balanceBreakdown.push({
             type: 'settled_by_you',
             amount: sett.amount,
             date: sett.date,
             message: `You paid ${toUser?.name} ₹${sett.amount}`
          });
       } else if (toId === userId) {
          const fromUser = group.members.find(m => m._id.toString() === fromId);
          balanceBreakdown.push({
             type: 'settled_to_you',
             amount: sett.amount,
             date: sett.date,
             message: `${fromUser?.name} paid you ₹${sett.amount}`
          });
       }
    });

    // sort breakdown by date (newest first)
    balanceBreakdown.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 5. Get recent expenses (limit 10)
    const recentExpenses = await Expense.find({ group: groupId })
      .sort({ date: -1 })
      .limit(10)
      .populate('paidBy', 'name email profileImage');

    // Return everything
    res.json({
      group: {
        _id: group._id,
        name: group.name,
        code: group.code,
        type: group.type,
        membersCount: group.members.length,
      },
      summary: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        thisMonthExpenses: Math.round(thisMonthExpenses * 100) / 100,
        pendingBalancesCount: owesList.length + owedList.length,
      },
      balances: {
        youOwe: Math.round(youOwe * 100) / 100,
        youAreOwed: Math.round(youAreOwed * 100) / 100,
        owesList,
        owedList,
        balanceBreakdown,
      },
      recentExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is the admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group admin can delete the group' });
    }

    // Delete associated expenses, settlements, and notifications
    await Expense.deleteMany({ group: groupId });
    await Settlement.deleteMany({ group: groupId });
    await Notification.deleteMany({ group: groupId });

    // Remove group from all members' groups array
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    // Delete the group
    await group.deleteOne();

    res.json({ message: 'Group removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupDashboard,
  deleteGroup,
};
