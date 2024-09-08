import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asynchronousHandler.js";
import jwt from "jsonwebtoken"
// import { User } from "../models/user.models.js";
const verifyJwt=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken|| req.header
        ("Authorization")?.replace("Bearer ","")
    
        if (!token){
            throw new ApiError(401,"Invalid Tokens")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCCESS_TOKEN_START)
    
        const user=await User.findById(decodedToken?._id).select
        ("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid access")
    
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(400,error?.message||"Token not find")
    }
})

export {verifyJwt}