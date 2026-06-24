const { Parent, User } = require('../model/models');
const bcrypt = require('bcrypt');

// Add parent
exports.addparent = async (req, res) => {
  try {
    const { name, email, nationalId } = req.body;
    const existingParentEmail = await User.findOne({ email });
    if (existingParentEmail) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const existingParentId = await Parent.findOne({ nationalId });
    if (existingParentId) {
      return res.status(400).json({ msg: "National ID already exists" });
    }

    const newParent = new Parent(req.body);
    const savedParent = await newParent.save();
    
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
    
    res.status(201).json({ parent: savedParent, message: "Parent added account created successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Get all parents - FIXED
exports.getallparents = async (req, res) => {
  try {
    const parents = await Parent.find();
    res.status(200).json(parents);
  } catch (error) {
    return res.status(400).json({ message: error.message });
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
    res.status(200).json(updatedParent);
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
    res.status(200).json({ message: "Parent deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};