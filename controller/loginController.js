const { User } = require("../model/models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register logic
exports.registerAdmin = async (req, res) => {
  const { name, email, password, secretkey } = req.body;
  
  // verify admin secret key
  if (secretkey !== process.env.secretkey) {
    return res.status(403).json({ message: "Unauthorized account creation" });
  }
  
  // check if the user exists
  const userexist = await User.findOne({ email });
  if (userexist) {
    return res.status(400).json({ message: "Email has already been taken" });
  }
  
  // hashing the password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // create a new user
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
    teacher: null,
    parent: null,
  });
  
  // new user creation
  await user.save();
  res.json({ message: "Account created", user });
}

// Login logic - ✅ FIXED: Returns teacherId and parentId
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // ✅ Extended to 24 hours
    );
    
    // ✅ FIXED: Return complete user data with teacherId and parentId
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo || null,
      teacherId: user.teacher || null,   // ✅ Important for teachers
      parentId: user.parent || null,     // ✅ Important for parents
      isActive: user.isActive
    };
    
    res.json({
      message: "Login successful",
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error during login" });
  }
}
