const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Public routes (for admin dashboard)
router.get("/", auth, parentController.getallparents);

// Protected routes
router.post("/", auth, authorizeRoles("admin"), parentController.uploadParentPhoto, parentController.addparent);
router.get("/dashboard", auth, authorizeRoles("parent"), parentController.getParentDashboard);
router.get("/:id", auth, parentController.getParentById);
router.get("/:id/students", auth, parentController.getParentStudents);
router.put("/:id", auth, authorizeRoles("admin"), parentController.uploadParentPhoto, parentController.updateParent);
router.delete("/:id", auth, authorizeRoles("admin"), parentController.deleteParent);

module.exports = router;
