const mongoose = require("mongoose")
const Schema = mongoose.Schema

// User Schema - Add photo field
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['admin', 'teacher', 'parent'], required: true },
  photo: { type: String, default: null }, // ✅ Added photo field
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null },
}, { timestamps: true })

// Teacher Schema - Add photo field
const teacherSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  subject: { type: String },
  photo: { type: String, default: null }, // ✅ Added photo field
  bio: { type: String }, // ✅ Added bio field
  qualifications: { type: String }, // ✅ Added qualifications
}, { timestamps: true })

// Parent Schema - Add photo field
const parentSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  nationalId: { type: String, required: true, unique: true },
  address: { type: String },
  photo: { type: String, default: null }, // ✅ Added photo field
  occupation: { type: String }, // ✅ Added occupation
}, { timestamps: true })

// Classroom Schema
const classroomSchema = new Schema({
  name: { type: String, required: true },
  gradeLevel: { type: String },
  classYear: { type: Number },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }]
}, { timestamps: true })

// Student Schema
const studentSchema = new Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String },
  photo: { type: String, default: null },
  admissionNumber: { type: String, unique: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" }
}, { timestamps: true })

// Assignment Schema
const AssignmentSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
}, { timestamps: true })

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
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true })

// Message Schema
const messageSchema = new Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['admin', 'teacher', 'parent'], required: true },
  senderName: { type: String, required: true },
  recipientType: { 
    type: String, 
    enum: ['all', 'teachers', 'parents', 'students', 'admin', 'specific'],
    default: 'all'
  },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true })

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

// Prepare exports
const User = mongoose.model("User", userSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const Classroom = mongoose.model("Classroom", classroomSchema);
const Parent = mongoose.model("Parent", parentSchema);
const Student = mongoose.model("Student", studentSchema);
const Assignment = mongoose.model("Assignment", AssignmentSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const Message = mongoose.model("Message", messageSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = { User, Teacher, Classroom, Parent, Student, Assignment, Notification, Message, Attendance };
