const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotification');

// @desc    Log a new settlement (Mark as Paid)
// @route   POST /api/settlements
// @access  Private
const logSettlement = async (req, res) => {
  try {
    const { group: groupId, toUser, amount } = req.body;
    const fromUser = req.user._id;

    if (!groupId || !toUser || !amount) {
      return res.status(400).json({ message: 'Please provide group, recipient (toUser), and amount' });
    }

    const groupObj = await Group.findById(groupId);
    if (!groupObj) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!groupObj.members.includes(fromUser) || !groupObj.members.includes(toUser)) {
      return res.status(403).json({ message: 'Both users must be members of the group' });
    }

    // Check if there is already a pending settlement between these two users
    const existingPending = await Settlement.findOne({
      group: groupId,
      fromUser,
      toUser,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({ message: 'There is already a pending settlement request to this user' });
    }

    const settlement = await Settlement.create({
      group: groupId,
      fromUser,
      toUser,
      amount,
      status: 'pending', // Starts as pending until recipient confirms
    });

    const debtor = await User.findById(fromUser);
    const creditor = await User.findById(toUser);
    const debtorName = debtor ? debtor.name : 'Someone';
    const creditorName = creditor ? creditor.name : 'someone else';
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    // Log Notification
    await Notification.create({
      group: groupId,
      message: `${debtorName} marked ${formattedAmount} as paid to ${creditorName}`,
      type: 'settlement_logged',
    });

    // Send push notification to other group members
    const otherMembers = groupObj.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    sendPushNotification(
      otherMembers,
      `Payment Sent in ${groupObj.name}`,
      `${debtorName} marked ${formattedAmount} as paid to ${creditorName}`,
      { groupId }
    );

    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a settlement (Mark as Received)
// @route   PUT /api/settlements/:id/approve
// @access  Private
const approveSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement record not found' });
    }

    // Only the recipient (toUser) can approve the payment receipt
    if (settlement.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the payment recipient can confirm receipt' });
    }

    if (settlement.status === 'completed') {
      return res.status(400).json({ message: 'Settlement is already completed' });
    }

    settlement.status = 'completed';
    await settlement.save();

    const debtor = await User.findById(settlement.fromUser);
    const creditor = await User.findById(settlement.toUser);
    const debtorName = debtor ? debtor.name : 'Someone';
    const creditorName = creditor ? creditor.name : 'someone else';
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(settlement.amount);

    // Log Notification
    await Notification.create({
      group: settlement.group,
      message: `${creditorName} confirmed receipt of ${formattedAmount} from ${debtorName}`,
      type: 'settlement_completed',
    });

    // Send push notification to other group members
    const groupObj = await Group.findById(settlement.group);
    if (groupObj) {
      const otherMembers = groupObj.members.filter(memberId => memberId.toString() !== req.user._id.toString());
      sendPushNotification(
        otherMembers,
        `Payment Confirmed in ${groupObj.name}`,
        `${creditorName} confirmed receipt of ${formattedAmount} from ${debtorName}`,
        { groupId: settlement.group.toString() }
      );
    }

    res.json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all settlements for a group
// @route   GET /api/settlements/group/:groupId
// @access  Private
const getGroupSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    const groupObj = await Group.findById(groupId);
    if (!groupObj) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const settlements = await Settlement.find({ group: groupId })
      .sort({ date: -1 })
      .populate('fromUser', 'name email profileImage')
      .populate('toUser', 'name email profileImage');

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logSettlement,
  approveSettlement,
  getGroupSettlements,
};
