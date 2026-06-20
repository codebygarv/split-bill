const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotification');

// @desc    Add a new expense to a group
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { group: groupId, amount, category, notes, date, receiptImage, paidBy, splitType, splitMembers, customSplits } = req.body;

    if (!groupId || !amount || !category || !paidBy) {
      return res.status(400).json({ message: 'Please provide group, amount, category, and payer' });
    }

    const groupObj = await Group.findById(groupId);
    if (!groupObj) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user belongs to group
    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to post in this group' });
    }

    let resolvedSplitBetween = [];

    // Calculate splits based on splitType
    if (splitType === 'equal') {
      // Split equally among either selected members, or all group members
      const activeMembers = (splitMembers && splitMembers.length > 0) ? splitMembers : groupObj.members;
      
      const share = Math.round((amount / activeMembers.length) * 100) / 100;
      
      // Handle rounding error on the last member
      let accumulated = 0;
      activeMembers.forEach((memberId, index) => {
        if (index === activeMembers.length - 1) {
          resolvedSplitBetween.push({
            user: memberId,
            amount: Math.round((amount - accumulated) * 100) / 100
          });
        } else {
          resolvedSplitBetween.push({
            user: memberId,
            amount: share
          });
          accumulated += share;
        }
      });
    } else if (splitType === 'custom') {
      // customSplits should be an array of { user: userId, amount: number }
      if (!customSplits || customSplits.length === 0) {
        return res.status(400).json({ message: 'Custom split values are required' });
      }

      // Verify custom splits sum to total amount
      let sum = 0;
      customSplits.forEach(s => {
        sum += s.amount;
        resolvedSplitBetween.push({
          user: s.user,
          amount: Math.round(s.amount * 100) / 100
        });
      });

      if (Math.abs(sum - amount) > 0.05) {
        return res.status(400).json({ message: `Split sum (${sum}) does not match expense amount (${amount})` });
      }
    } else {
      return res.status(400).json({ message: 'Invalid split type. Use "equal" or "custom"' });
    }

    const expense = await Expense.create({
      group: groupId,
      amount,
      category,
      notes: notes || '',
      date: date || new Date(),
      receiptImage: receiptImage || '',
      paidBy,
      splitBetween: resolvedSplitBetween,
    });

    // Create Notification
    const payer = await Group.model('User').findById(paidBy);
    const payerName = payer ? payer.name : 'Someone';
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    
    await Notification.create({
      group: groupId,
      message: `${payerName} added ${formattedAmount} for ${category}`,
      type: 'expense_added',
    });

    // Send push notification to other group members
    const otherMembers = groupObj.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    sendPushNotification(
      otherMembers,
      `New Bill in ${groupObj.name}`,
      `${payerName} added ${formattedAmount} for ${category}`,
      { groupId }
    );

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { amount, category, notes, date, paidBy, splitType, splitMembers, customSplits } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const groupObj = await Group.findById(expense.group);
    
    // Verify user belongs to group
    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (date) expense.date = date;
    if (paidBy) expense.paidBy = paidBy;

    if (splitType) {
      const activeAmount = amount || expense.amount;
      let resolvedSplitBetween = [];

      if (splitType === 'equal') {
        const activeMembers = (splitMembers && splitMembers.length > 0) ? splitMembers : groupObj.members;
        const share = Math.round((activeAmount / activeMembers.length) * 100) / 100;
        
        let accumulated = 0;
        activeMembers.forEach((memberId, index) => {
          if (index === activeMembers.length - 1) {
            resolvedSplitBetween.push({
              user: memberId,
              amount: Math.round((activeAmount - accumulated) * 100) / 100
            });
          } else {
            resolvedSplitBetween.push({
              user: memberId,
              amount: share
            });
            accumulated += share;
          }
        });
      } else if (splitType === 'custom') {
        if (!customSplits || customSplits.length === 0) {
          return res.status(400).json({ message: 'Custom split values are required' });
        }
        let sum = 0;
        customSplits.forEach(s => {
          sum += s.amount;
          resolvedSplitBetween.push({
            user: s.user,
            amount: Math.round(s.amount * 100) / 100
          });
        });
        if (Math.abs(sum - activeAmount) > 0.05) {
          return res.status(400).json({ message: `Split sum (${sum}) does not match expense amount (${activeAmount})` });
        }
      }
      expense.splitBetween = resolvedSplitBetween;
    }

    const updatedExpense = await expense.save();

    // Log Notification
    const msg = `${req.user.name} updated the expense of ${updatedExpense.category}`;
    await Notification.create({
      group: expense.group,
      message: msg,
      type: 'expense_updated',
    });

    // Send push notification to other group members
    const otherMembers = groupObj.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    sendPushNotification(
      otherMembers,
      `Bill Updated in ${groupObj.name}`,
      msg,
      { groupId: expense.group.toString() }
    );

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const groupObj = await Group.findById(expense.group);
    
    // Verify user belongs to group
    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const deletedExpenseCategory = expense.category;
    const deletedExpenseAmount = expense.amount;
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(deletedExpenseAmount);

    await expense.deleteOne();

    // Log Notification
    const msg = `${req.user.name} deleted the expense of ${formattedAmount} for ${deletedExpenseCategory}`;
    await Notification.create({
      group: groupObj._id,
      message: msg,
      type: 'expense_deleted',
    });

    // Send push notification to other group members
    const otherMembers = groupObj.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    sendPushNotification(
      otherMembers,
      `Bill Deleted in ${groupObj.name}`,
      msg,
      { groupId: groupObj._id.toString() }
    );

    res.json({ message: 'Expense removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/expenses/group/:groupId
// @access  Private
const getGroupExpenses = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    const groupObj = await Group.findById(groupId);
    if (!groupObj) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Build filter query
    const filter = { group: groupId };

    // Filter by Category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by Month (e.g. format: "YYYY-MM")
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by Member (payer or split participant)
    if (req.query.member) {
      filter.$or = [
        { paidBy: req.query.member },
        { 'splitBetween.user': req.query.member }
      ];
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .populate('paidBy', 'name email profileImage')
      .populate('splitBetween.user', 'name email profileImage');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email profileImage')
      .populate('splitBetween.user', 'name email profileImage');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const groupObj = await Group.findById(expense.group);
    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addExpense,
  updateExpense,
  deleteExpense,
  getGroupExpenses,
  getExpenseById,
};
