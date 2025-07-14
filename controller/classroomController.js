const { Classroom}=require('../model/models')

// all classrooms
exports.addClassroom= async(req,res)=>{
  try {
    //recieve data from client
    const newClassroom=req.body
    console.log(newClassroom)

    const savedClassroom=new Classroom(newClassroom)
    await savedClassroom.save()
    res.status(201).json(savedClassroom)

    
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}

// get all classrooms
exports.getClassroom= async(req,res)=>{
    try {
        const classrooms=await Classroom.find()
        // console.log(classrooms)
        // populate teacher,name,email,phone
        .populate('teacher','name email phone')
        .populate('students' ,'name admissionNumber')
        res.status(200).json(classrooms)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

// get a single classroom
exports.getClassroomById= async(req,res)=>{
    try {
        const classroomId=req.params.id
        const classroom=await Classroom.findById(classroomId)
        .populate('teacher','name email phone')
        .populate('students' ,'name admissionNumber')
        if(!classroom){
            res.status(404).json({message:'classroom not found'})
}
        res.status(200).json(classroom)
        } catch (error) {
        res.status(500).json({message:error.message})
    }
}
// update a classroom
exports.updateClassroom= async(req,res)=>{
    try {
        const classroomId=req.params.id
        const newClassroom=req.body
        const updatedClassroom=await Classroom.findByIdAndUpdate(classroomId,newClassroom,{new:true})
        .populate('teacher','name email phone')
        .populate('students' ,'name admissionNumber')
        if(!updatedClassroom){
            res.status(404).json({message:'classroom not found'})
}
            res.status(200).json(updatedClassroom)
            } catch (error) {
            res.status(500).json({message:error.message})
    }
}
// delete a classroom
exports.deleteClassroom= async(req,res)=>{
    try {
        const classroomId=req.params.id
        await Classroom.findByIdAndDelete(classroomId)
        res.status(200).json({message:'classroom deleted'})
        } catch (error) {
            res.status(500).json({message:error.message})
            }
            }  // end of exports.deleteClassroom= async(req,res)=>{}  // end of exports
            // add a student to a classroom
            exports.addStudentToClassroom= async(req,res)=>{
                try {
                    const classroomId=req.params.id
                    const studentId=req.body.studentId
                    const student=await Student.findById(studentId)
                    if(!student){
                     res.status(404).json({message:'student not found'})
                    }
                     const classroom=await Classroom.findById(classroomId)
                    if(!classroom){
        res.status(404).json({message:'classroom not found'})
 }
         classroom.students.push(studentId)
         await classroom.save()
         res.status(200).json(classroom)
        } catch (error) {
        res.status(500).json({message:error.message})
    }
 }  
 
 