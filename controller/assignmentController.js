const{Asignment,User,Classroom}=require('../model/models')

// get all assignments
exports .getAssignments=async(req,res)=>{
    try {
        const assignments=await Asignment.find()
        .populate('classroom','name gradeLevel classYear')
        .populate('postedBy','name email phone')
        res.status(200).json(assignments)
        } catch (error) {
            res.status(500).json({message:error.message})
         }
 }
//  add assignments only teachers
// validate user and classroom existence
exports .addAssignment=async (req,res)=>{
    try {
        // get the logged in user
        const userId=req.user.userId
        // fetch theuser and populate the teacher
        const user=await User.findById(userId)
        .populate('teacher')

        
    } catch (error) {
        
    }
}


