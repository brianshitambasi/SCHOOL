const { Parent, User, Student, Assignment } = require('../model/models');
const bcrypt = require('bcrypt');

// Add parent
exports.addparent = async (req, res) => {
  try {
    const { name, email, phone, nationalId, address } = req.body;
    
    console.log('Adding parent with data:', { name, email, phone, nationalId, address });
    
    // Validate required fields
    if (!name || !email || !phone || !nationalId) {
      return res.status(400).json({ msg: "Name, email, phone and nationalId are required" });
    }
    
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

    // Create parent
    const newParent = new Parent({
      name,
      email,
      phone,
      nationalId,
      address
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
      parent: savedParent._id
    });
    await newUser.save();
    
    res.status(201).json({ 
      parent: savedParent, 
      message: "Parent added successfully. Default password: parent1234" 
    });
  } catch (error) {
    console.error('Add parent error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get all parents - Admin only
exports.getallparents = async (req, res) => {
  try {
    console.log('Fetching all parents...');
    const parents = await Parent.find();
    console.log('Parents found:', parents.length);
    res.status(200).json(parents);
  } catch (error) {
    console.error('Get parents error:', error);
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Get parent by ID
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    res.status(200).json(parent);
  } catch (error) {
    console.error('Get parent by ID error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Update parent
exports.updateParent = async (req, res) => {
  try {
    const updatedParent = await Parent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedParent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    
    res.status(200).json({ 
      message: "Parent updated successfully",
      parent: updatedParent 
    });
  } catch (error) {
    console.error('Update parent error:', error);
    return res.status(500).json({ message: error.message });
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
    console.error('Delete parent error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// PARENT DASHBOARD - Only sees their own children
// ============================================
exports.getParentDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the parent profile
    const user = await User.findById(userId).populate('parent');
    if (!user || !user.parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Get ONLY this parent's children (students linked to this parent)
    const children = await Student.find({ parent: user.parent._id })
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone');

    // Get assignments for ONLY this parent's children's classes
    const classroomIds = children.map(s => s.classroom?._id).filter(Boolean);
    let assignments = [];
    if (classroomIds.length > 0) {
      assignments = await Assignment.find({ 
        classroom: { $in: classroomIds } 
      })
      .populate('classroom', 'name')
      .populate('postedBy', 'name');
    }

    res.status(200).json({
      parent: user.parent,
      children: children,
      assignments: assignments,
      stats: {
        totalChildren: children.length,
        totalAssignments: assignments.length,
        pendingAssignments: assignments.filter(a => a.dueDate > new Date()).length
      }
    });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get parent's children only
exports.getParentChildren = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the parent profile
    const user = await User.findById(userId).populate('parent');
    if (!user || !user.parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Get ONLY this parent's children
    const children = await Student.find({ parent: user.parent._id })
      .populate('classroom', 'name gradeLevel classYear')
      .populate('parent', 'name email phone');

    res.status(200).json(children);
  } catch (error) {
    console.error('Get parent children error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific child's details
exports.getChildDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const childId = req.params.id;
    
    // Get the parent profile
    const user = await User.findById(userId).populate('parent');
    if (!user || !user.parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Verify this child belongs to this parent
    const child = await Student.findOne({ 
      _id: childId,
      parent: user.parent._id 
    })
    .populate('classroom', 'name gradeLevel classYear')
    .populate('parent', 'name email phone');

    if (!child) {
      return res.status(404).json({ 
        message: "Child not found or does not belong to this parent" 
      });
    }

    res.status(200).json(child);
  } catch (error) {
    console.error('Get child details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get assignments for parent's children
exports.getParentAssignments = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the parent profile
    const user = await User.findById(userId).populate('parent');
    if (!user || !user.parent) {
      return res.status(404).json({ message: "Parent profile not found" });
    }

    // Get ONLY this parent's children
    const children = await Student.find({ parent: user.parent._id });
    const classroomIds = children.map(s => s.classroom?._id).filter(Boolean);

    let assignments = [];
    if (classroomIds.length > 0) {
      assignments = await Assignment.find({ 
        classroom: { $in: classroomIds } 
      })
      .populate('classroom', 'name')
      .populate('postedBy', 'name');
    }

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Get parent assignments error:', error);
    res.status(500).json({ message: error.message });
  }
};
