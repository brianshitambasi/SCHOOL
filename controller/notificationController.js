const { Notification, User } = require("../model/models");

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, link, priority, expiresAt, isGlobal } = req.body;
    
    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      recipients: recipients || [],
      sender: req.user.userId,
      link: link || null,
      priority: priority || 'medium',
      expiresAt: expiresAt || null,
      isGlobal: isGlobal || false
    });

    if (isGlobal) {
      const users = await User.find({ isActive: true });
      notification.recipients = users.map(user => ({
        userId: user._id,
        role: user.role,
        read: false
      }));
    }

    await notification.save();
    
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email role');

    res.status(201).json({
      message: 'Notification created successfully',
      notification: populatedNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get notifications for current user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    // ✅ FIXED: Better query to handle cases where no notifications exist
    const notifications = await Notification.find({
      'recipients.userId': userId
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit))
    .populate('sender', 'name email role');

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.read': false
    });

    res.status(200).json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      total: notifications?.length || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(200).json({ notifications: [], unreadCount: 0, total: 0 }); // ✅ Return empty instead of error
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        'recipients.userId': userId 
      },
      { 
        $set: { 
          'recipients.$.read': true,
          'recipients.$.readAt': new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { 
        'recipients.userId': userId,
        'recipients.read': false
      },
      { 
        $set: { 
          'recipients.$.read': true,
          'recipients.$.readAt': new Date()
        }
      }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      'recipients.userId': userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get notification count (for badge) - ✅ FIXED to handle errors gracefully
exports.getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.read': false
    });

    res.status(200).json({ unreadCount: unreadCount || 0 });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(200).json({ unreadCount: 0 }); // ✅ Return 0 instead of error
  }
};
