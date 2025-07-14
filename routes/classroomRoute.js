const express=require('express')
const router=express.Router()
const classroomController=require("../controller/classroomController")

router.post('/',classroomController.addClassroom)
router.get("/", classroomController.getClassroom);
router.get("/:id", classroomController.getClassroomById);
router.put("/:id", classroomController.updateClassroom);
router.delete("/:id", classroomController.deleteClassroom);


module.exports=router