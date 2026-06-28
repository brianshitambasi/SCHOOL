const { Attendance, Student, Classroom, User } = require("../model/models");

// Mark attendance for multiple students
exports.markAttendance = async (req, res) => {
  try {
    const { classroomId, date, attendance: attendanceData, note } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('Marking attendance - User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Classroom ID:', classroomId);

    // Verify user is a teacher or admin
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return res.status(403).json({ message: "Only teachers and admins can mark attendance" });
    }

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    console.log('Classroom found:', classroom.name);
    console.log('Classroom teacher:', classroom.teacher);

    // If user is a teacher, verify they are assigned to this classroom
    if (userRole === 'teacher') {
      // Get the teacher ID from the user
      const user = await User.findById(userId).populate('teacher');
      if (!user || !user.teacher) {
        return res.status(403).json({ message: "Teacher profile not found" });
      }
      
      console.log('User teacher ID:', user.teacher._id);
      
      // Check if the teacher is assigned to this classroom
      if (classroom.teacher && classroom.teacher.toString() !== user.teacher._id.toString()) {
        console.log('Teacher mismatch - Classroom teacher:', classroom.teacher);
        console.log('User teacher:', user.teacher._id);
        return res.status(403).json({ 
          message: "You are not assigned to this classroom" 
        });
      }
    }

    // Process attendance for each student
    const attendanceRecords = [];
    for (const item of attendanceData) {
      const { studentId, status, note: studentNote } = item;
      
      // Check if attendance already exists for this student on this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAttendance = await Attendance.findOne({
        student: studentId,
        classroom: classroomId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.note = studentNote || note;
        existingAttendance.markedBy = userId;
        await existingAttendance.save();
        attendanceRecords.push(existingAttendance);
      } else {
        // Create new attendance record
        const newAttendance = new Attendance({
          student: studentId,
          classroom: classroomId,
          date: new Date(date),
          status,
          markedBy: userId,
          note: studentNote || note
        });
        await newAttendance.save();
        attendanceRecords.push(newAttendance);
      }
    }

    res.status(200).json({
      message: `Attendance marked for ${attendanceRecords.length} students`,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance for a classroom on a specific date
exports.getClassroomAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('Get classroom attendance - User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Classroom ID:', classroomId);

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // If user is a teacher, verify they are assigned to this classroom
    if (userRole === 'teacher') {
      const user = await User.findById(userId).populate('teacher');
      if (!user || !user.teacher) {
        return res.status(403).json({ message: "Teacher profile not found" });
      }
      
      if (classroom.teacher && classroom.teacher.toString() !== user.teacher._id.toString()) {
        return res.status(403).json({ 
          message: "You are not assigned to this classroom" 
        });
      }
    }
    
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      classroom: classroomId,
      date: { $gte: queryDate, $lte: endDate }
    }).populate('student', 'name admissionNumber photo');

    // Get all students in the classroom
    const classroomWithStudents = await Classroom.findById(classroomId).populate('students', 'name admissionNumber photo');
    
    // Create a map of attendance statuses
    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.student._id] = record.status;
    });

    // Build complete list with status
    const studentsWithAttendance = classroomWithStudents.students.map(student => ({
      student,
      status: attendanceMap[student._id] || 'not marked'
    }));

    res.status(200).json({
      date: queryDate,
      students: studentsWithAttendance,
      summary: {
        total: studentsWithAttendance.length,
        present: studentsWithAttendance.filter(s => s.status === 'present').length,
        absent: studentsWithAttendance.filter(s => s.status === 'absent').length,
        late: studentsWithAttendance.filter(s => s.status === 'late').length,
        excused: studentsWithAttendance.filter(s => s.status === 'excused').length,
        notMarked: studentsWithAttendance.filter(s => s.status === 'not marked').length
      }
    });
  } catch (error) {
    console.error('Get classroom attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get student attendance summary
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { student: studentId };
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const attendance = await Attendance.find(query)
      .populate('classroom', 'name')
      .sort({ date: -1 });

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      percentage: attendance.length > 0 
        ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
        : 0
    };

    res.status(200).json({ attendance, summary });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance summary for a classroom (by date range)
exports.getClassroomAttendanceSummary = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { classroom: classroomId };
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

    const attendance = await Attendance.find(query)
      .populate('student', 'name');

    // Group by student
    const studentAttendance = {};
    attendance.forEach(record => {
      const studentId = record.student._id;
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: record.student,
          records: []
        };
      }
      studentAttendance[studentId].records.push(record);
    });

    // Calculate summary for each student
    const summary = Object.values(studentAttendance).map(item => ({
      student: item.student,
      total: item.records.length,
      present: item.records.filter(r => r.status === 'present').length,
      absent: item.records.filter(r => r.status === 'absent').length,
      late: item.records.filter(r => r.status === 'late').length,
      excused: item.records.filter(r => r.status === 'excused').length,
      percentage: item.records.length > 0
        ? Math.round((item.records.filter(r => r.status === 'present').length / item.records.length) * 100)
        : 0
    }));

    res.status(200).json({
      startDate,
      endDate,
      summary
    });
  } catch (error) {
    console.error('Get classroom attendance summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update attendance status
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Only teachers and admins can update
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return res.status(403).json({ message: "Only teachers and admins can update attendance" });
    }

    // If teacher, verify they are assigned to the classroom
    if (userRole === 'teacher') {
      const user = await User.findById(userId).populate('teacher');
      if (!user || !user.teacher) {
        return res.status(403).json({ message: "Teacher profile not found" });
      }
      
      const classroom = await Classroom.findById(attendance.classroom);
      if (classroom && classroom.teacher && classroom.teacher.toString() !== user.teacher._id.toString()) {
        return res.status(403).json({ 
          message: "You are not assigned to this classroom" 
        });
      }
    }

    attendance.status = status || attendance.status;
    attendance.note = note || attendance.note;
    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate('student', 'name admissionNumber');

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};
