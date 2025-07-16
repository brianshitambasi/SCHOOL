const { User } = require("../model/models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//register logic
exports.registerAdmin = async (req, res) => {
  const { name, email, password, secretkey } = req.body;
  // verify admin secret key
  if (secretkey !== process.env.secretkey) {
    return res.status(403).json({ message: "unauthorized account creation" });
  }
  // check if the user exists
  const userexist = await User.findOne({ email });
  if (userexist) {
    res.json({ message: "Email has already been taken" });
  }
  // hashing the password
  const hashedPassword = await bcrypt.hash(password, 10);
  // create a new user
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role:"admin",
    isActive: true,
    teacher: null,
    parent: null,
  });
  //new user creation
  const newUser = await user.save();
  res.json({ message: "account created", user });
}
//login logic
exports.login = async (req, res) => {
  const { email, password } = req.body;
//   console.log(email, password);
//   res.json({ message: "login successful" });
  // check if the user exists by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  // check if the user is active
  if (!user.isActive) {
        return res.status(403).json({ message: "account is inactive" });
    }
    // check if the password is correct
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: "invalid password" });
    }
    // generate token
    const token = jwt.sign({ userId: user._id.role}, process.env.secretkey, {
        expiresIn: "1h",
        });
        res.json({ message: "login successful",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }});
}

  
