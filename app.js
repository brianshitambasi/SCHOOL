// Entry file
const express=require('express')
const mongoose=require('mongoose')
const cors =require("cors")
require("dotenv").config()

const app=express()
app.use(express.json())
app.use(cors())
// static file accessibility
app.use("/uploads",express.static("uploads"))


//login routes
const UserAuth=require('./routes/loginRoutes')
app.use('/user/Auth',UserAuth)

// classroom routes
const ClassroomRoutes=require('./routes/classroomRoute')
app.use('/classroom',ClassroomRoutes)

// parents routes
const ParentRoutes=require('./routes/parentRoutes')
app.use('/parent',ParentRoutes)

// teacher routes
const TeacherRoutes=require("./routes/teacherRoutes")
app.use('/teacher',TeacherRoutes)

// students routes
const StudentRoutes = require("./routes/studentRoute");
app.use("/student", StudentRoutes);







// connection to the database
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("mongodb connected"))
.catch(err=>console.log("mongodb connected error",err))



const PORT=3004
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})
