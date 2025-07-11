// require mongoose

const mongoose=require("mongoose")
const Schema=mongoose.Schema
    // define the user schem

const userSchema=new mongoose.Schema({
        name:{type:String},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},
        isActive:{type:Boolean,default:true},
        role:{type:String,enum:['admin','teacher','parent'],required:true},
        teacher:{type:mongoose.Schema.Types.ObjectId,ref:'Teacher',default:null},
        parent:{type:mongoose.Schema.Types.ObjectId,ref:'parent',default:null},
},{timestamps:true})
// teachers schema 
const teacherSchema = new Schema(
  {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        subject: { type: String },
  },{timestamps:true});
// parents schema
const parentSchema = new Schema(
  {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
        nationalId: { type: String, required: true, unique: true },
        address: { type: String },
  },
  { timestamps: true }
);
//the classroom
const classroomSchema=new Schema({
        name:{type:String,required:true},
        gradeLevel:{type:String},
        classYear:{type:Number},
        teacher:{type:mongoose.Schema.Types.ObjectId,ref:"Teacher",default:null},
        students:{type:mongoose.Schema.Types.ObjectId,ref:"student",default:null}
},{timestamps:true})

// student Schema
const studentSchema=new Schema({
        name:{type:String,required:true},
        dateOfBirth:{type:Date,required:true},
        gender:{type:String},
        photo:{types:String},
        addmissionNumber:{type:String,Unique:true},
        classroom:{type:mongoose.Schema.Types.ObjectId,ref:"Classroom"},
        parent:{type:mongoose.Schema.Types.ObjectId,ref:"parent"}
},{timestamps:true})

// assignmnts
const AssignmentSchema=new Schema({
    title:{type:String,required:true},
    description:{type:String},
    dueDate:{type:Date},
    classroom:{type:mongoose.Schema.Types.ObjectId,ref:"Classroom"},
    postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"Teacher"}

},{timestamps:true})

// prepare exports
const User=mongoose.model("User",userSchema);
const Teacher=mongoose.model("Teacher",teacherSchema);
const Classroom=mongoose.model("Classroom",classroomSchema);
const Parent=mongoose.model("Parent",parentSchema);
const Student=mongoose.model("Student",studentSchema)
const Assignment=mongoose.model("Assignment",AssignmentSchema)
 
module.exports={User,Teacher,Classroom,Parent,Student,Assignment}
 
