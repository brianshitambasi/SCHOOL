// import the jwt
const jwt=require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET)

const auth=async(req,res,next)=>{
    //extracts authorization header
    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    //get actual token from the auth header
    const token=authHeader && authHeader.split(' ')[1]
    console.log(token)
    // check if no token, return bad request
    if(!token) return res.status(404).json({error:'Please authenticate'})
        // verify the token
    try{
        console.log("Try catch")
        // verify the token using the secret key
        const payload = jwt.verify(token,JWT_SECRET);
        // we attach the payload to the request object
        // this is the logged in user
        
        
        req.user = payload;
        console.log(req.user)
        // proceed to the next route or the function
        next();
    }catch(error){
        res.status(500).json({message:error})

    }
}
//middle ware to authorize access based on the user role
//accepts  any number of allowed roles(eg "admin","teacher")
// params accepts any number of arguments and automatically puts them into an array
const authorizeRoles=(...allowedRoles)=>{
    return (req,res,next)=>{
        if (!req.user || !allowedRoles.includes(req.user.role)){
            return res.status(403).json({error:'You are not authorized to access this route...Acces denied insufficient permissions... '})
        }
        next()
    }
}
module.exports={auth,authorizeRoles}
