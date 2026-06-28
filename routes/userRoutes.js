const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { auth } = require("../middleware/auth");

router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, userController.uploadUserPhoto, userController.updateProfile);

module.exports = router;
