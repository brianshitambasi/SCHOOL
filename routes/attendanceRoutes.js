const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Mark attendance (Teachers only)
router.post("/", auth, authorizeRoles("teacher"), attendanceController.markAttendance);

// Get classroom attendance for a date (Teachers & Admins)
router.get("/classroom/:classroomId", auth, attendanceController.getClassroomAttendance);

// Get classroom attendance summary (Teachers & Admins)
router.get("/classroom/:classroomId/summary", auth, attendanceController.getClassroomAttendanceSummary);

// Get student attendance (Parents & Admins & Teachers)
router.get("/student/:studentId", auth, attendanceController.getStudentAttendance);

// Update attendance (Teachers only)
router.put("/:attendanceId", auth, authorizeRoles("teacher"), attendanceController.updateAttendance);

module.exports = router;
