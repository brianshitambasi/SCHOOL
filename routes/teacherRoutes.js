const express = require("express");
const router = express.Router();
const teachersController = require("../controller/teachersController");
// authozization
const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/",  teachersController.addTeacher);

router.get("/",  teachersController.getAllTeachers);
router.get("/:myclasses",  teachersController.getTeacherById);
router.get("/:id", teachersController.getTeacherById);
router.put("/:id",auth, authorizeRoles('admin','teacher'), teachersController.updateTeacher);
router.delete("/id",teachersController.deleteTeacher)


module.exports = router;
