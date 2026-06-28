const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Parent Dashboard - For logged-in parent (only sees their own children)
router.get("/dashboard", auth, authorizeRoles("parent"), parentController.getParentDashboard);

// Parent's children only
router.get("/children", auth, authorizeRoles("parent"), parentController.getParentChildren);

// Parent's assignments only
router.get("/assignments", auth, authorizeRoles("parent"), parentController.getParentAssignments);

// Parent's specific child details
router.get("/child/:id", auth, authorizeRoles("parent"), parentController.getChildDetails);

// Admin routes (can see all parents)
router.get("/", auth, authorizeRoles("admin"), parentController.getallparents);
router.post("/", auth, authorizeRoles("admin"), parentController.addparent);
router.get("/:id", auth, authorizeRoles("admin"), parentController.getParentById);
router.put("/:id", auth, authorizeRoles("admin"), parentController.updateParent);
router.delete("/:id", auth, authorizeRoles("admin"), parentController.deleteParent);

module.exports = router;
