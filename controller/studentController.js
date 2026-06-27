const { Student, Classroom, Parent } = require("../model/models");
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'students',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadStudentPhoto = upload.single('photo');

// Add Student
exports.addStudent = async (req, res) => {
  try {
    const { 
      name, 
      dateOfBirth, 
      gender, 
      admissionNumber, 
      parentNationalId, 
      classromId 
    } = req.body;

    const parentExists = await Parent.findOne({ nationalId: parentNationalId });
    if (!parentExists) {
      return res.status(404).json({ 
        message: "Parent with provided national ID does not exist." 
      });
    }

    const studentExists = await Student.findOne({ admissionNumber });
    if (studentExists) {
      return res.status(400).json({ 
        message: "Admission number already assigned" 
      });
    }

    const classExist = await Classroom.findById(classromId);
    if (!classExist) {
      return res.status(404).json({ 
        message: "Classroom not found" 
      });
    }

    let photo = null;
    if (req.file) {
      photo = req.file.path; // Cloudinary URL
    }

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

    await Classroom.findByIdAndUpdate(
      classExist._id,
      { $addToSet: { students: savedStudent._id } }
    );

    res.status(201).json({
      message: "Student added successfully",
      student: savedStudent
    });
  } catch (error) {
    console.error('Add student error:', error);
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
    console.error('Get students error:', error);
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
    console.error('Get student error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;

    if (updateData.classroom) {
      const classExist = await Classroom.findById(updateData.classroom);
      if (!classExist) {
        return res.status(404).json({ message: "Classroom not found" });
      }
    }

    if (updateData.parent) {
      const parentExists = await Parent.findById(updateData.parent);
      if (!parentExists) {
        return res.status(404).json({ message: "Parent not found" });
      }
    }

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true }
    ).populate('classroom', 'name gradeLevel classYear')
     .populate('parent', 'name email phone nationalId');

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(studentId);
    
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete from Cloudinary if photo exists
    if (deletedStudent.photo && deletedStudent.photo.includes('cloudinary')) {
      try {
        const publicId = deletedStudent.photo.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`students/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }

    await Classroom.updateOne(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    res.status(200).json({ 
      message: "Student deleted successfully",
      student: deletedStudent
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: error.message });
  }
};
