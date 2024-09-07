import { User } from "../models/user.models";
import { ApiError } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asynchronousHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models";
const verifyJwt=asyncHandler(async(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken||req.header
        ("Authorization")?.replace("bearer ","")
    
        if (!token){
            throw new ApiError(401,"Invalid Tokens")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCCESS_TOKEN_START)
    
        const myUser=User.findById(decodedToken?._id).select
        ("-password -refreshToken")
    
        if(!myUser){
            throw new ApiError(401,"Invalid access")
    
        }
    
        req.myUser=myUser
        next()
    } catch (error) {
        throw new ApiError(400,error?.message||"Token not find")
    }
})

export {verifyJwt}