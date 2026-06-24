const { Student, Classroom, Parent } = require("../model/models");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });
exports.uploadStudentPhoto = upload.single('photo');

// Add student
exports.addStudent = async (req, res) => {
  try {
    // Destructuring
    const { 
      name, 
      dateOfBirth, 
      gender, 
      admissionNumber, 
      parentNationalId, 
      classromId 
    } = req.body;

    // Check if the parent exists by national id
    const parentExists = await Parent.findOne({ nationalId: parentNationalId });
    if (!parentExists) {
      return res.status(404).json({ 
        message: "Parent with provided national ID does not exist" 
      });
    }

    // Check if the student exists
    const studentExists = await Student.findOne({ admissionNumber });
    if (studentExists) {
      return res.status(400).json({ 
        message: "Admission number has already been assigned to someone else" 
      });
    }

    // Check if the class exists
    const classExist = await Classroom.findById(classromId);
    if (!classExist) {
      return res.status(404).json({ 
        message: "Classroom not found" 
      });
    }

    // Prepare upload file
    let photo = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const newFileName = Date.now() + ext;
      const newPath = path.join(uploadDir, newFileName);
      photo = newPath.replace(/\\/g, "/");
    }

    // Create student document
    const newStudent = new Student({
      name,
      dateOfBirth,
      gender,
      admissionNumber,
      photo,
      parent: parentExists._id,
      classroom: classExist._id
    });

    const savedStudent = await newStudent.save();

    // Adding student to classroom using addToSet to prevent duplicates
    await Classroom.findByIdAndUpdate(
      classExist._id,
      { $addToSet: { students: savedStudent._id } }
    );

    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone nationalId');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone nationalId');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('classroom', 'name gradeLevel classYear')
     .populate('parent', 'name email phone nationalId');

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove student from classroom
    await Classroom.updateOne(
      { students: req.params.id },
      { $pull: { students: req.params.id } }
    );

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
