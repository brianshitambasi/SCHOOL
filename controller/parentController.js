const { Parent, User, Student } = require('../model/models');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary for parent photos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'parents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadParentPhoto = upload.single('photo');

// Add parent with photo
exports.addparent = async (req, res) => {
  try {
    const { name, email, phone, nationalId, address, occupation } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Check if parent exists
    const existingParent = await Parent.findOne({ nationalId });
    if (existingParent) {
      return res.status(400).json({ msg: "National ID already exists" });
    }

    // Handle photo upload
    let photo = null;
    if (req.file) {
      photo = req.file.path; // Cloudinary URL
    }

    // Create parent
    const newParent = new Parent({
      name,
      email,
      phone,
      nationalId,
      address,
      photo,
      occupation
    });
    const savedParent = await newParent.save();
    
    // Create user account
    const defaultPassword = "parent1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "parent",
      photo,
      parent: savedParent._id
    });
    await newUser.save();
    
    res.status(201).json({ 
      parent: savedParent, 
      message: "Parent added, account created successfully. Default password: parent1234" 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get all parents
exports.getallparents = async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate('students', 'name admissionNumber classroom');
    res.status(200).json(parents);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get parent by ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate({
        path: 'students',
        populate: {
          path: 'classroom',
          select: 'name gradeLevel'
        }
      });
    
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    res.status(200).json(parent);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Update parent with photo
exports.updateParent = async (req, res) => {
  try {
    const updateData = req.body;
    
    // Handle photo upload
    if (req.file) {
      updateData.photo = req.file.path; // Cloudinary URL
    }

    const updatedParent = await Parent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!updatedParent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    // Update user photo if changed
    if (updateData.photo) {
      await User.findOneAndUpdate(
        { parent: req.params.id },
        { photo: updateData.photo }
      );
    }
    
    res.status(200).json({ 
      message: "Parent updated successfully",
      parent: updatedParent 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Delete parent
exports.deleteParent = async (req, res) => {
  try {
    const deletedParent = await Parent.findByIdAndDelete(req.params.id);
    if (!deletedParent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    await User.findOneAndDelete({ parent: req.params.id });
    
    await Student.updateMany(
      { parent: req.params.id },
      { $set: { parent: null } }
    );
    
    res.status(200).json({ message: "Parent deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get students by parent ID
exports.getParentStudents = async (req, res) => {
  try {
    const parentId = req.params.id;
    const students = await Student.find({ parent: parentId })
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone');
    
    res.status(200).json(students);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get parent dashboard
exports.getParentDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('parent');
    if (!user || !user.parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    const students = await Student.find({ parent: user.parent._id })
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone');

    const classrooms = students.map(s => s.classroom?._id).filter(Boolean);
    const assignments = await Assignment.find({ 
      classroom: { $in: classrooms } 
    })
    .populate('classroom', 'name')
    .populate('postedBy', 'name');

    res.status(200).json({
      parent: user.parent,
      students,
      assignments,
      stats: {
        totalChildren: students.length,
        totalAssignments: assignments.length,
        pendingAssignments: assignments.filter(a => a.dueDate > new Date()).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
