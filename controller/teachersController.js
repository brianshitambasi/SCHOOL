const { Teacher, User, Classroom } = require("../model/models");
const bcrypt = require("bcrypt");
// Add teacher
exports.addTeacher = async (req, res) => {
  // check if teacher already exists
  try {
    const { email } = req.body;
    const existEmail = await Teacher.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    // create the teacher
    const newTeacher = new Teacher(req.body);
    await newTeacher.save();

    // create a corresponding user document
    // default password for the user
    const defaultPassword = "teacher1234";
    const password = await bcrypt.hash(defaultPassword, 10);
    const newUser = new User({
      name: newTeacher.name,
      email: newTeacher.email,
      password,
      role: "teacher",
      teacher: newTeacher._id,
    });
    await newUser.save();
    res.status(201).json({
      message: "Teacher registered successfully",
      teacher: newTeacher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get teacher by id
exports.getTeacherById = async (req, res) => {
  try {
    const id = req.params.id;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update teacher
exports.updateTeacher = async (req,res) => {
  try {
    console.log("hi")
    const teachersId = req.params.id;
    const updateData = req.body;
    const userId = req.user.userId;
    
    const existUser = await User.findById(userId);
    if (!existUser) {
      return res
        .status(404)
        .json({ message: "User not found... email already does not exists" });
    }
    
    const existTeacher = await Teacher.findById(teachersId);
    if (!existTeacher) {
      return res
        .status(404)
        .json({ message: "Email already  does not exists" });
    }
    if (updateData.password && req.user.role == "admin") {
      return res.status(403).json({
        message: "permission denied...does not have rights to update",
      });
    }
    if (req.user.role == "teacher" && existUser.teacher!== teachersId) {
      return res.status(403).json({ message: "request not allowed" });
    }
   if(updateData.password){
    const hashpassword = await bcrypt.hash(updateData.password,10)
    updateData.password=hashedpassword
   }
   

   const user= await User.findOne({teacher:teachersId})
   const savedUser = await User.findByIdAndUpdate(
    user._id,updateData,{new:true}
   )

   const savedTeacher =await Teacher.findByIdAndUpdate(teachersId,updateData,{new:true})
   res.json({message:"teacher updated"})
  }catch (error) {
       res.status(500).json({ message: error.message });
       
  }

   }
  //  delete teacher
  exports.deleteTeacher=async (req,res)=>{
    try {
      const teacherId=req.params.id

      // delete teacher
      const deletedTeacher=await Teacher.findByIdAndDelete(teacherId)
      if (!deletedTeacher) return res.status(404).json({message:'teacher not found'})
        // assign a teacher from any class
      await Classroom.updateMany(
        {teacher:teacherId},
        {$set:{teacher:null}})

        res.status(200).json({message:"deleted succefully"})
      
    } catch (error) {
       res.status(500).json({ message: error.message });
    }
  }
  // get all teachers classes
exports.getMyClasses=async (req,res)=>{
  try {
    const userId=req.params.id
    // find all classes for the teacher
    const user=await Classroom.findById(userId)
      .populate ("teacher")

      // check if the user exists and is linked to the user
      if (!user.teacher) return res.status().json({message:"teacher not found"})
        const classes = await Classroom.find({teacher:user.teacher._id})
            .populate("students")
            res.status(200).json(classes)
  }catch(error){

    res .status(500).json({message:error.message})
  }
}
   
  
