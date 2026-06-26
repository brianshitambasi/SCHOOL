// require mongoose
const mongoose = require("mongoose")
const Schema = mongoose.Schema

// define the user schema
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['admin', 'teacher', 'parent'], required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null },
}, { timestamps: true })

// teachers schema 
const teacherSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  subject: { type: String },
}, { timestamps: true })

// parents schema
const parentSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  nationalId: { type: String, required: true, unique: true },
  address: { type: String },
}, { timestamps: true })

// THE CLASSROOM - students should be an ARRAY
const classroomSchema = new Schema({
  name: { type: String, required: true },
  gradeLevel: { type: String },
  classYear: { type: Number },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
}, { timestamps: true })

// student Schema - FIXED typos
const studentSchema = new Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String },
  photo: { type: String },
  admissionNumber: { type: String, unique: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" }
}, { timestamps: true })

// ✅ FIXED: AssignmentSchema is properly defined
const AssignmentSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
}, { timestamps: true })

// prepare exports
const User = mongoose.model("User", userSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const Classroom = mongoose.model("Classroom", classroomSchema);
const Parent = mongoose.model("Parent", parentSchema);
const Student = mongoose.model("Student", studentSchema);
const Assignment = mongoose.model("Assignment", AssignmentSchema);

module.exports = { User, Teacher, Classroom, Parent, Student, Assignment };

// Notification Schema
const notificationSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'assignment', 'attendance', 'fee', 'exam'],
    default: 'info'
  },
  recipients: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'teacher', 'parent', 'all'] },
    read: { type: Boolean, default: false },
    readAt: { type: Date }
  }],
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  link: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  expiresAt: { type: Date },
  isGlobal: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false }
}, { timestamps: true })

// prepare exports - Add Notification
const Notification = mongoose.model("Notification", notificationSchema);

// Update module exports
module.exports = { User, Teacher, Classroom, Parent, Student, Assignment, Notification };

// Attendance Schema
const attendanceSchema = new Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  date: { type: Date, required: true, default: Date.now },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present'
  },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  note: { type: String },
  semester: { type: String },
  term: { type: Number, enum: [1, 2, 3] }
}, { timestamps: true })

// prepare exports - Add Attendance
const Attendance = mongoose.model("Attendance", attendanceSchema);

// Update module exports
module.exports = { User, Teacher, Classroom, Parent, Student, Assignment, Notification, Attendance };
