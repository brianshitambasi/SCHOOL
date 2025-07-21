const {Parent,User}=require('../model/models')
const bcrypt=require('bcrypt')

// add parent

exports.addparent = async(req, res) => {
    try {
        // destructure variable to ceck  if the parent exists
        const {name,email, nationalId} = req.body;
        // check using email
        const existingParentEmail = await User.findOne({email});
        if (existingParentEmail) {
            return res.status(400).json({msg: "email already exists"});
            }

        // check using the id  
        const existingParentId = await Parent.findOne({nationalId});
        if (existingParentId) {
            return res.status(400).json({msg: "Natinal ID already exists"});
            }

            // when all check are good we now save the new parent
            const newParent = new Parent(req.body)
            const savedParent = await newParent.save();
            // crreating the parent user account
            const defaultPassword = "parent1234";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const newUser = new User({
                name,email,
                password: hashedPassword,
                role: "parent",
                parent: savedParent._id
                });
                await newUser.save();
                res.status(201).json({parent:savedParent,message: "Parent added account created successfully"});


    } catch (error) {
        return res.status(400).json({message:error.message})
        
    }
}
// get all parents
exports.getallparents = async(req, res) => {
    try {
        const parents = await Parent.find()
        res.status(200).json(parents);
    } catch (error) {
        return res.status(400).json({message:error.message})
    }
}
// update parent
exports.updateParent=async (req,res)=>{
    try {
        const updatedParent=await Parent.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        )
        if(!updatedParent) return res.status(404).json({message:"parent not found"})
            res.status(201).json(updatedParent)
        
    } catch (error) {
         return res.status(400).json({ message: error.message });
        
    }
}
// delete parent
exports.deleteParent=async (req,res)=>{
    try {
        const deletedParent=await Parent.findByIdAndDelete(req.params.id)
        if(!deletedParent) return res.status(404).json({message:"parent not found"})
            // delete also the associated user account
        await User.findOneAndDelete({parent:req.params.id})
        
            res.status(200).json({message:"parent deleted successfully"})
    }catch(error){
        return res.status(400).json({message:error.message})
        }
    }









