// Entry file
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors")
require("dotenv").config()

const app = express()
app.use(express.json())
app.use(cors())
app.use("/uploads", express.static("uploads"))

// Routes
const UserAuth = require('./routes/loginRoutes')
app.use('/user/Auth', UserAuth)

const ClassroomRoutes = require('./routes/classroomRoute')
app.use('/classroom', ClassroomRoutes)

const ParentRoutes = require('./routes/parentRoutes')
app.use('/parent', ParentRoutes)

const TeacherRoutes = require("./routes/teacherRoutes")
app.use('/teacher', TeacherRoutes)

const StudentRoutes = require("./routes/studentRoute")
app.use("/student", StudentRoutes)

// âœ… ADD THIS - Assignment routes
const AssignmentRoutes = require("./routes/assignmentRoutes")
app.use("/assignment", AssignmentRoutes)

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("âœ… MongoDB connected successfully"))
  .catch(err => console.error("âŒ MongoDB connection error:", err.message))

const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`íº€ Server running on port ${PORT}`)
})
