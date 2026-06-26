const { Attendance, Student, Classroom, Teacher } = require("../model/models");

// Mark attendance for multiple students
exports.markAttendance = async (req, res) => {
  try {
    const { classroomId, date, attendance: attendanceData, note } = req.body;
    const teacherId = req.user.userId;

    // Verify teacher is assigned to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if teacher is assigned to this class
    const teacher = await Teacher.findOne({ _id: teacherId });
    if (!teacher) {
      return res.status(403).json({ message: "Only teachers can mark attendance" });
    }

    // Process attendance for each student
    const attendanceRecords = [];
    for (const item of attendanceData) {
      const { studentId, status, note: studentNote } = item;
      
      // Check if attendance already exists for this student on this date
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        classroom: classroomId,
        date: new Date(date).setHours(0, 0, 0, 0)
      });

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.status = status;
        existingAttendance.note = studentNote || note;
        existingAttendance.markedBy = teacherId;
        await existingAttendance.save();
        attendanceRecords.push(existingAttendance);
      } else {
        // Create new attendance record
        const newAttendance = new Attendance({
          student: studentId,
          classroom: classroomId,
          date: new Date(date),
          status,
          markedBy: teacherId,
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
    res.status(500).json({ message: error.message });
  }
};

// Get attendance for a classroom on a specific date
exports.getClassroomAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date } = req.query;
    
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      classroom: classroomId,
      date: { $gte: queryDate, $lte: endDate }
    }).populate('student', 'name admissionNumber photo');

    // Get all students in the classroom
    const classroom = await Classroom.findById(classroomId).populate('students', 'name admissionNumber photo');
    
    // Create a map of attendance statuses
    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.student._id] = record.status;
    });

    // Build complete list with status
    const studentsWithAttendance = classroom.students.map(student => ({
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
    res.status(500).json({ message: error.message });
  }
};

// Update attendance status
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, note } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status, note },
      { new: true }
    ).populate('student', 'name admissionNumber');

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
