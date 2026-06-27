const express = require("express");
const router = express.Router();
const messageController = require("../controller/messageController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Send a message (Admin, Teacher, Parent)
router.post("/", auth, messageController.sendMessage);

// Get user's inbox
router.get("/inbox", auth, messageController.getUserMessages);

// Get sent messages
router.get("/sent", auth, messageController.getSentMessages);

// Get message by ID
router.get("/:id", auth, messageController.getMessageById);

// Mark message as read
router.put("/:id/read", auth, messageController.markAsRead);

// Delete message
router.delete("/:id", auth, messageController.deleteMessage);

module.exports = router;
