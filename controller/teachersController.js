const { Teacher, User, Classroom, Student, Assignment } = require("../model/models");
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
    
    const existEmail = await Teacher.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let photo = null;
    if (req.file) {
      photo = req.file.path;
    }

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
    console.error('Add teacher error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers (Admin only)
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
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
    console.error('Get teacher error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// TEACHER DASHBOARD - Only teacher's own data
// ============================================
exports.getTeacherDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get teacher profile
    const user = await User.findById(userId).populate('teacher');
    if (!user || !user.teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const teacherId = user.teacher._id;

    // Get teacher's classes
    const classes = await Classroom.find({ teacher: teacherId })
      .populate('students', 'name admissionNumber');

    // Get teacher's students (all students in their classes)
    const studentIds = [];
    classes.forEach(cls => {
      if (cls.students) {
        cls.students.forEach(s => {
          if (!studentIds.includes(s._id.toString())) {
            studentIds.push(s._id.toString());
          }
        });
      }
    });
    
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('classroom', 'name gradeLevel')
      .populate('parent', 'name email phone');

    // Get teacher's assignments
    const assignments = await Assignment.find({ postedBy: teacherId })
      .populate('classroom', 'name gradeLevel');

    const totalStudents = students.length;
    const totalClasses = classes.length;
    const totalAssignments = assignments.length;

    res.status(200).json({
      teacher: user.teacher,
      classes,
      students,
      assignments,
      stats: {
        totalStudents,
        totalClasses,
        totalAssignments,
        pendingAssignments: assignments.filter(a => a.dueDate > new Date()).length
      }
    });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's own classes
exports.getMyClasses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('teacher');
    
    if (!user || !user.teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    const classes = await Classroom.find({ teacher: user.teacher._id })
      .populate('students', 'name admissionNumber');
    
    res.status(200).json(classes);
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's own students
exports.getMyStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('teacher');
    
    if (!user || !user.teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    const classes = await Classroom.find({ teacher: user.teacher._id })
      .populate('students', 'name admissionNumber gender dateOfBirth photo');
    
    const students = [];
    const studentIds = new Set();
    classes.forEach(cls => {
      if (cls.students) {
        cls.students.forEach(s => {
          if (!studentIds.has(s._id.toString())) {
            studentIds.add(s._id.toString());
            students.push(s);
          }
        });
      }
    });
    
    res.status(200).json(students);
  } catch (error) {
    console.error('Get my students error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's own assignments
exports.getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('teacher');
    
    if (!user || !user.teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    const assignments = await Assignment.find({ postedBy: user.teacher._id })
      .populate('classroom', 'name gradeLevel');
    
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const teachersId = req.params.id;
    const updateData = req.body;
    const userId = req.user.userId;
    
    if (req.file) {
      updateData.photo = req.file.path;
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

    if (req.user.role === "teacher" && existUser.teacher?.toString() !== teachersId) {
      return res.status(403).json({ message: "Request not allowed" });
    }

    if (updateData.password) {
      const hashpassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashpassword;
    }

    const savedTeacher = await Teacher.findByIdAndUpdate(teachersId, updateData, { new: true });
    
    if (updateData.photo) {
      await User.findOneAndUpdate(
        { teacher: teachersId },
        { photo: updateData.photo }
      );
    }

    res.json({ message: "Teacher updated", teacher: savedTeacher });
  } catch (error) {
    console.error('Update teacher error:', error);
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
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: error.message });
  }
};
