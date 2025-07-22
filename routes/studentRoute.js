const express = require("express");
const router = express.Router();
const classroomController = require("../controller/classroomController");
// authorization

const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/",auth,authorizeRoles("admin"), classroomController.addClassroom);
// router.get("/", auth, classroomController.getClassroom);
// router.get("/:id", auth, classroomController.getClassroomById);
// router.put(
//   "/:id",
//   auth,
//   authorizeRoles("admin"),
//   classroomController.updateClassroom
// );
// router.delete(
//   "/:id",
//   auth,
//   authorizeRoles("admin"),
//   classroomController.deleteClassroom
// );


module.exports = router;
