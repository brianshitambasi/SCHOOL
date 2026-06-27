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

// Configure Cloudinary Storage for multer
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

exports.uploadStudentPhoto = upload.single('photo');

// ============================================
// 1. ADD STUDENT WITH CLOUDINARY PHOTO
// ============================================
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

    // Check if parent exists by national ID
    const parentExists = await Parent.findOne({ nationalId: parentNationalId });
    if (!parentExists) {
      return res.status(404).json({ 
        message: "Parent with provided national ID does not exist. Please add parent first." 
      });
    }

    // Check if student exists by admission number
    const studentExists = await Student.findOne({ admissionNumber });
    if (studentExists) {
      return res.status(400).json({ 
        message: "Admission number has already been assigned to someone else" 
      });
    }

    // Check if classroom exists
    const classExist = await Classroom.findById(classromId);
    if (!classExist) {
      return res.status(404).json({ 
        message: "Classroom not found" 
      });
    }

    // Get photo URL from Cloudinary (if uploaded)
    let photo = null;
    if (req.file) {
      photo = req.file.path; // Cloudinary URL
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

    // Add student to classroom
    await Classroom.findByIdAndUpdate(
      classExist._id,
      { $addToSet: { students: savedStudent._id } }
    );

    res.status(201).json({
      message: "Student added successfully",
      student: savedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// 2. GET ALL STUDENTS
// ============================================
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

// ============================================
// 3. GET STUDENT BY ID
// ============================================
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

// ============================================
// 4. UPDATE STUDENT
// ============================================
exports.updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;

    // If updating classroom, check if it exists
    if (updateData.classroom) {
      const classExist = await Classroom.findById(updateData.classroom);
      if (!classExist) {
        return res.status(404).json({ message: "Classroom not found" });
      }
    }

    // If updating parent, check if it exists
    if (updateData.parent) {
      const parentExists = await Parent.findById(updateData.parent);
      if (!parentExists) {
        return res.status(404).json({ message: "Parent not found" });
      }
    }

    // If new photo uploaded, update photo URL
    if (req.file) {
      updateData.photo = req.file.path; // Cloudinary URL
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
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// 5. DELETE STUDENT
// ============================================
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    const deletedStudent = await Student.findByIdAndDelete(studentId);
    
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // If student had a photo in Cloudinary, delete it
    if (deletedStudent.photo) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = deletedStudent.photo.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(`students/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with student deletion even if Cloudinary fails
      }
    }

    // Remove student from classroom
    await Classroom.updateOne(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    res.status(200).json({ 
      message: "Student deleted successfully",
      student: deletedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
