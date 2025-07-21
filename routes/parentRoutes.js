const express = require("express");
const router = express.Router();
const parentController = require("../controller/parentController");
// authorization

const { auth, authorizeRoles } = require("../middleware/auth");

router.post("/",auth,authorizeRoles("admin"),parentController.addparent);
router.get("/", parentController.getallparents);
router.put("/:id",parentController.updateParent);
router.delete("/:id",parentController.deleteParent);




module.exports = router;
