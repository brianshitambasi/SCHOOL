const { Assignment, User, Classroom } = require("../model/models");
// get all assignments (Admin view)
// includes classroom and teacher information

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("classroom", "name gradeLevel classYear")
      .populate("postedBy", "name email phone");
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add assignments only teachers
// Validate user and classroom existence

exports.addAssignment = async (req, res) => {
  try {
    // Get thye logged in user
    const userId = req.user.userId;
    // fetch the user and populate the 'teacher' field if it exist
    const user = await User.findById(userId).populate("teacher");

    // Block non teacher from posting
    if (!user || !user.teacher)
      return res.status(403).json({ messsage: "Only teacher can post" });

    // extract classroomId from the request
    const { classroom: classroomId } = req.body;
    // check if classroom exists first
    const classroomExist = await Classroom.findById(classroomId);
    if (!classroomExist)
      return res.status(404).json({ message: "Classroom not found" });

    // prepare the assignment data
    const assignmentData = {
      ...req.body,
      postedBy: user.teacher._id,
    };
    // save the assignment to db
    const newAssignment = new Assignment(assignmentData);
    const savedAssignment = await newAssignment.save();
    res.status(201).json(savedAssignment).populate("postedBy", "name");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all current assignments
// includes classroom and teacher information
exports.getCurrentAssignments = async (req, res) => {
  try {
    const currentDate = new Date();
    const assignments = await Assignment.find({
      dueDate: { $gte: currentDate },
    })
      .populate("classroom", "name gradeLevel classYear")
      .populate("postedBy", "name email phone");
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// single assignment
// includes classroom and teacher information
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("classroom")
      .populate("postedBy");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const updatedData = req.body;

    // find the assignment by ID and update it
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updatedData,
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment Updated", updatedAssignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const deletedAssignment = await Assignment.findByIdAndDelete(assignmentId);

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
