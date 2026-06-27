const { Message, User } = require("../model/models");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { subject, message, recipientType, recipientIds, priority } = req.body;
    const senderId = req.user.userId;

    // Get sender details
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Prepare recipients based on recipientType
    let recipients = [];
    if (recipientType === 'all') {
      // Send to all active users
      const allUsers = await User.find({ isActive: true, _id: { $ne: senderId } });
      recipients = allUsers.map(u => u._id);
    } else if (recipientType === 'specific' && recipientIds && recipientIds.length > 0) {
      recipients = recipientIds;
    } else {
      // Get users by role
      let role = recipientType === 'teachers' ? 'teacher' : 
                 recipientType === 'parents' ? 'parent' : 
                 recipientType === 'students' ? 'student' : null;
      
      if (role) {
        const users = await User.find({ role, isActive: true, _id: { $ne: senderId } });
        recipients = users.map(u => u._id);
      } else if (recipientType === 'admin') {
        const admins = await User.find({ role: 'admin', isActive: true, _id: { $ne: senderId } });
        recipients = admins.map(u => u._id);
      }
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: "No valid recipients found" });
    }

    // Create message
    const newMessage = new Message({
      subject,
      message,
      sender: senderId,
      senderRole: sender.role,
      senderName: sender.name,
      recipientType,
      recipients,
      priority: priority || 'medium',
      readBy: []
    });

    await newMessage.save();

    // Populate sender info for response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email role');

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get messages for current user (inbox)
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await Message.find({
      recipients: userId
    })
    .populate('sender', 'name email role')
    .sort({ createdAt: -1 });

    // Mark which messages are read
    const messagesWithReadStatus = messages.map(msg => {
      const isRead = msg.readBy.some(r => r.userId.toString() === userId.toString());
      return {
        ...msg.toObject(),
        isRead
      };
    });

    res.status(200).json(messagesWithReadStatus);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get sent messages by current user
exports.getSentMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    const messages = await Message.find({
      sender: userId
    })
    .populate('sender', 'name email role')
    .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get message by ID
exports.getMessageById = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.userId;

    const message = await Message.findById(messageId)
      .populate('sender', 'name email role');

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Mark as read
    if (!message.readBy.some(r => r.userId.toString() === userId.toString())) {
      message.readBy.push({ userId });
      await message.save();
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.readBy.some(r => r.userId.toString() === userId.toString())) {
      message.readBy.push({ userId });
      await message.save();
    }

    res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is sender or admin
    const user = await User.findById(userId);
    if (message.sender.toString() !== userId && user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: error.message });
  }
};
