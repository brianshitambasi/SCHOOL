const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/", auth, authorizeRoles("admin"), parentController.addparent);
router.get("/", parentController.getallparents);
router.put("/:id", auth, authorizeRoles("admin"), parentController.updateParent); // ✅ Added auth
router.delete("/:id", auth, authorizeRoles("admin"), parentController.deleteParent); // ✅ Added auth

module.exports = router;