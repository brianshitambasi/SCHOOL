const express = require("express");
const router = express.Router();
const assignmentController = require("../controller/assignmentController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Get all assignments (Admin & Teacher view)
router.get("/", auth, assignmentController.getAllAssignments);

// Get current assignments
router.get("/current", auth, assignmentController.getCurrentAssignments);

// Get assignment by ID
router.get("/:id", auth, assignmentController.getAssignmentById);

// Add assignment (Teachers only)
router.post("/", auth, authorizeRoles("admin", "teacher"), assignmentController.addAssignment);

// Update assignment (Teachers only)
router.put("/:id", auth, authorizeRoles("admin", "teacher"), assignmentController.updateAssignment);

// Delete assignment (Teachers only)
router.delete("/:id", auth, authorizeRoles("admin", "teacher"), assignmentController.deleteAssignment);

module.exports = router;
