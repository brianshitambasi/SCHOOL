const { Teacher, User, Classroom } = require("../model/models");
const bcrypt = require("bcrypt");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary for teacher photos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teachers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadTeacherPhoto = upload.single('photo');

// Add teacher with photo
exports.addTeacher = async (req, res) => {
  try {
    const { email, name, phone, subject, bio, qualifications } = req.body;
    
    // Check if teacher exists
    const existEmail = await Teacher.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Handle photo upload
    let photo = null;
    if (req.file) {
      photo = req.file.path; // Cloudinary URL
    }

    // Create teacher
    const newTeacher = new Teacher({
      name,
      email,
      phone,
      subject,
      photo,
      bio,
      qualifications
    });
    await newTeacher.save();

    // Create user account
    const defaultPassword = "teacher1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
      photo,
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

// Update teacher with photo
exports.updateTeacher = async (req, res) => {
  try {
    const teachersId = req.params.id;
    const updateData = req.body;
    const userId = req.user.userId;
    
    // Handle photo upload
    if (req.file) {
      updateData.photo = req.file.path; // Cloudinary URL
    }

    const existUser = await User.findById(userId);
    if (!existUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const existTeacher = await Teacher.findById(teachersId);
    if (!existTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (updateData.password && req.user.role === "admin") {
      return res.status(403).json({
        message: "Permission denied...does not have rights to update",
      });
    }

    if (req.user.role === "teacher" && existUser.teacher !== teachersId) {
      return res.status(403).json({ message: "Request not allowed" });
    }

    if (updateData.password) {
      const hashpassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashpassword;
    }

    // Update teacher
    const savedTeacher = await Teacher.findByIdAndUpdate(teachersId, updateData, { new: true });
    
    // Update user photo
    if (updateData.photo) {
      await User.findOneAndUpdate(
        { teacher: teachersId },
        { photo: updateData.photo }
      );
    }

    res.json({ message: "Teacher updated", teacher: savedTeacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;

    const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);
    if (!deletedTeacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    await User.findOneAndDelete({ teacher: teacherId });
    
    await Classroom.updateMany(
      { teacher: teacherId },
      { $set: { teacher: null } }
    );

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers classes
exports.getMyClasses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate("teacher");
    
    if (!user.teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    const classes = await Classroom.find({ teacher: user.teacher._id })
      .populate("students");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
