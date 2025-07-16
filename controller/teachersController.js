const { Teacher, User } = require("../model/models");
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
    res
      .status(201)
      .json({
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
        const teachers = await Teacher.find()
        res.status(200).json(teachers);
        } catch (error) {
            res.status(500).json({ message: error.message });
            }
            };
 // Get teacher by id
 exports.getTeacherById = async (req, res) => {
        try {
            const id = req.params.id;
            const teacher = await Teacher.findById(id)
     if (!teacher) {
         return res.status(404).json({ message: "Teacher not found" });
}
     res.status(200).json(teacher);
        } catch (error) {
         res.status(500).json({ message: error.message });
      }
 };
 // Update teacher
 exports.updateTeacher = async (req, res) => {
    try {
        const id = req.params.id;
        const updateData=req.body
        const {email}=req.body
    const existUser=await User.findOne({email})
    if(!existUser){
        return res.status(404).json({message:"Email already does not exists"})
        }
        const existTeacher=await Teacher.findOne({email})
        if(!existTeacher){
            return res.status(404).json({message:"Email already  does not exists"})
        }
        if(updateData.password){
            const password = await bcrypt.hash(req.body.password, 10);
            updateData.password=password
        }

        // update user
        const updatedUser=await User.findByIdAndUpdate(id,updateData,{new:true})
        if(!updatedUser){
            return res.status(404).json({message:"User not found"})
        }
        // update teacher
        const updatedTeacher=await Teacher.findByIdAndUpdate(existUser.teacher,updateData,{new:true})
        if(!updatedTeacher){
            return res.status(404).json({message:"Teacher not found"})
            }
            res.status(200).json(updatedTeacher);
            } catch (error) {
                res.status(500).json({ message: error.message });
                }
                };



    
     
          


