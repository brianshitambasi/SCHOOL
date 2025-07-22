const { Parent } = require("../model/models");

// database
const {Student,Classroom,Parent}=require("../model/models")
const multer=require('multer')
const path=require('path')
// file location folder /directory
const upload=multer({dest:'upload/'})
exports.uploadStudentPhoto=upload.single('photo')
exports.addStudent=async(req,res)=>{
    try {
        // destructuring
        const {name,dateOfBirth,gender,admissionNumber,parentNationalId,classromId}=req.body
        // check if the parent exists by national id
        const parentExists=await Parent.findOne({nationalId:parentNationalId})
        if(!parent) return res.status(404).json({message:"parent with provided national id does not exist"})
        // check if the student exists 
        const studentExists=await Student.findOne({addmissionNumber})
        if(studentExists) return res.json({message:"addmission number has already been assigned to someone else"})
            // check if the class exists\
        const classExist=await Classroom.findById(classromId)
        if(!classExist) return res.status(500).json({message:"clasroom not found"})

            // prepare our upoad file
            let photo=null
            if(req.file){
                const ext=path.extname(req.file.originalname)
                const newFileName=Date.now()+ext
                const newPath=path.join("uploads",newPath)
                photo=newPath.replace(/\\/g,"/")

            }

            // create student document
            const newStudent=new Student({
                name,
                dateOfBirth,
                gender,
                admissionNumber,
                photo,
                parent:parentExists._id,
                classroom:classExist._id
            })

            const savedStudent=await newStudent.save()

            // addding students to aclass using the addToSet to Prevent duplicates
            await Classroom.findByIdAndUpdate(
                classExist._id,
                {$addToSet:{students:savedStudent._id}}
            )
            res.status(201).json(savedStudent)
        
    } catch (error) {
        res.status (500).json({message:error.message})
        
    }
}
