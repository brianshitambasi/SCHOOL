const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Make sure these routes are properly defined
router.post("/", auth, authorizeRoles("admin"), parentController.addparent);
router.get("/", parentController.getallparents);
router.put("/:id", auth, authorizeRoles("admin"), parentController.updateParent);
router.delete("/:id", auth, authorizeRoles("admin"), parentController.deleteParent);

module.exports = router;