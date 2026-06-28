const express = require("express");
const router = express.Router();
const teachersController = require("../controller/teachersController");
const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/", teachersController.uploadTeacherPhoto, teachersController.addTeacher);
router.get("/", teachersController.getAllTeachers);
router.get("/myclasses", auth, teachersController.getMyClasses);
router.get("/:id", teachersController.getTeacherById);
router.put("/:id", auth, authorizeRoles('admin', 'teacher'), teachersController.uploadTeacherPhoto, teachersController.updateTeacher);
router.delete("/:id", auth, authorizeRoles('admin'), teachersController.deleteTeacher);

module.exports = router;
