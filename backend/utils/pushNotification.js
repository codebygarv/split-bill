const User = require('../models/User');

/**
 * Sends a push notification to users via Expo Push API
 * @param {Array<string>} userIds - Array of recipient User IDs
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {Object} [data] - Optional payload data
 */
const sendPushNotification = async (userIds, title, body, data = {}) => {
  try {
    if (!userIds || userIds.length === 0) return;

    // Find users and fetch their push tokens
    const users = await User.find({
      _id: { $in: userIds },
      pushTokens: { $exists: true, $not: { $size: 0 } }
    }).select('pushTokens');

    const tokens = [];
    users.forEach(user => {
      if (user.pushTokens) {
        user.pushTokens.forEach(token => {
          if (token && token.startsWith('ExponentPushToken[')) {
            tokens.push(token);
          }
        });
      }
    });

    if (tokens.length === 0) {
      return;
    }

    // Build notification messages
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data
    }));

    // Send request to Expo Push API
    // Node 18+ has built-in global fetch.
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo push notification result:', JSON.stringify(result));
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  sendPushNotification
};
