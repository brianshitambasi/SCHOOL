const express=require('express')
const router=express.Router()
const teachersController=require("../controller/teachersController")

router.post('/',teachersController.addTeacher)
router.get("/", teachersController.getAllTeachers);
router.get('/:id',teachersController.getTeacherById)
router.put('/:id',teachersController.updateTeacher)

module.exports=router