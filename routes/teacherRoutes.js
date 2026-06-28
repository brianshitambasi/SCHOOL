const express = require("express");
const router = express.Router();
const teachersController = require("../controller/teachersController");
const { auth, authorizeRoles } = require("../middleware/auth");

// ✅ IMPORTANT: Specific routes MUST come before the /:id route

// Teacher Dashboard - Only teacher's own data
router.get("/dashboard", auth, authorizeRoles("teacher"), teachersController.getTeacherDashboard);

// Teacher's own classes
router.get("/my-classes", auth, authorizeRoles("teacher"), teachersController.getMyClasses);

// Teacher's own students
router.get("/my-students", auth, authorizeRoles("teacher"), teachersController.getMyStudents);

// Teacher's own assignments
router.get("/my-assignments", auth, authorizeRoles("teacher"), teachersController.getMyAssignments);

// Public routes (no auth needed for some)
router.post("/", teachersController.uploadTeacherPhoto, teachersController.addTeacher);
router.get("/", teachersController.getAllTeachers);

// ✅ This MUST come LAST - catches specific IDs
router.get("/:id", teachersController.getTeacherById);

// Update teacher
router.put("/:id", auth, authorizeRoles('admin', 'teacher'), teachersController.uploadTeacherPhoto, teachersController.updateTeacher);

// Delete teacher
router.delete("/:id", auth, authorizeRoles('admin'), teachersController.deleteTeacher);

module.exports = router;
