const { Classroom, Teacher, Student } = require('../model/models');

// Add classroom
exports.addClassroom = async (req, res) => {
  try {
    const newClassroom = req.body;
    const savedClassroom = new Classroom(newClassroom);
    await savedClassroom.save();
    res.status(201).json(savedClassroom);
  } catch (error) {
    console.error('Add classroom error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all classrooms
exports.getClassroom = async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate('teacher', 'name email phone')
      .populate('students', 'name admissionNumber');
    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get classroom by ID
exports.getClassroomById = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const classroom = await Classroom.findById(classroomId)
      .populate('teacher', 'name email phone')
      .populate('students', 'name admissionNumber');
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.status(200).json(classroom);
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update classroom
exports.updateClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const newClassroom = req.body;
    const updatedClassroom = await Classroom.findByIdAndUpdate(classroomId, newClassroom, { new: true })
      .populate('teacher', 'name email phone')
      .populate('students', 'name admissionNumber');
    if (!updatedClassroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    res.status(200).json(updatedClassroom);
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;
    await Classroom.findByIdAndDelete(classroomId);
    res.status(200).json({ message: 'Classroom deleted' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add student to classroom
exports.addStudentToClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const studentId = req.body.studentId;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    classroom.students.push(studentId);
    await classroom.save();
    res.status(200).json(classroom);
  } catch (error) {
    console.error('Add student to classroom error:', error);
    res.status(500).json({ message: error.message });
  }
};
