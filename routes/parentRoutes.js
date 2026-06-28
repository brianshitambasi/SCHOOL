const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/", auth, authorizeRoles("admin"), parentController.uploadParentPhoto, parentController.addparent);
router.get("/", parentController.getallparents);
router.get("/dashboard", auth, authorizeRoles("parent"), parentController.getParentDashboard);
router.get("/:id", auth, authorizeRoles("admin"), parentController.getParentById);
router.get("/:id/students", auth, parentController.getParentStudents);
router.put("/:id", auth, authorizeRoles("admin"), parentController.uploadParentPhoto, parentController.updateParent);
router.delete("/:id", auth, authorizeRoles("admin"), parentController.deleteParent);

module.exports = router;
