const { User } = require("../model/models");
const bcrypt = require("bcrypt");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary for user photos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadUserPhoto = upload.single('photo');

// Update user profile with photo
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone, address, currentPassword, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle photo upload
    let photo = user.photo;
    if (req.file) {
      photo = req.file.path; // Cloudinary URL
    }

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (photo) user.photo = photo;

    // Update password if provided
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Return updated user (without password)
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Profile updated successfully",
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
