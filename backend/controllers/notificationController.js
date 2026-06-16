const Notification = require('../models/Notification');
const Group = require('../models/Group');

// @desc    Get group notifications
// @route   GET /api/notifications/group/:groupId
// @access  Private
const getGroupNotifications = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const groupObj = await Group.findById(groupId);
    if (!groupObj) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user belongs to group
    if (!groupObj.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const notifications = await Notification.find({ group: groupId })
      .sort({ date: -1 })
      .limit(50); // Get last 50 notifications for performance

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGroupNotifications,
};
