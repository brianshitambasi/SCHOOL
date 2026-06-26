const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Get notifications for current user
router.get("/", auth, notificationController.getUserNotifications);

// Get unread count
router.get("/count", auth, notificationController.getNotificationCount);

// Create notification (Admin only)
router.post("/", auth, authorizeRoles("admin"), notificationController.createNotification);

// Mark notification as read
router.put("/:id/read", auth, notificationController.markAsRead);

// Mark all as read
router.put("/read-all", auth, notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", auth, notificationController.deleteNotification);

module.exports = router;
