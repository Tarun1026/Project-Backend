import { asyncHandler } from "../utils/asynchronousHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshToken=async(userId)=>{
  try {
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken
    user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Spmething wrong in generating Tokens")
    
  }
}
const registerUser = asyncHandler(async (req, res) => {
//   res.status(400).json({
//     message: "kida",
//   });
  const { fullName, username, email, password } = req.body;
//   console.log("username", username);

  if (
    [fullName, username, email, password].some((field) => field?.trim == "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  if (password.length < 6) {
    throw new ApiError(
      411,
      "Password should be greater than or equal to 6 characters"
    );
  }
  const alreadyExistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (alreadyExistedUser) {
    throw new ApiError(401, "User already exist");
  }

  const avgAvatarPath = req.files?.avatar[0]?.path;
  let avgCoverImagePath;
  // console.log("req",req.files)
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    avgCoverImagePath = req.files?.coverImage[0]?.path;
  }

  const avatar = await uploadOnCloudinary(avgAvatarPath);
  const coverImage = await uploadOnCloudinary(avgCoverImagePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is bro required");
  }
  // if (!coverImage){
  //     throw new ApiError(400,"cover is required")
  // }
  const createdUser = await User.create({
    fullName,
    avatar: avatar.url,
    password,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
  });

  const checkCreatedUser = await User.findById(createdUser._id).select(
    "-password -refreshToken"
  );
  if (!checkCreatedUser) {
    throw new ApiError(500, "Something wrong from our side while registering");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser=asyncHandler(async(req,res)=>{
  const {email,username,password}=req.body

  if(!username){
    throw new ApiError(400,"Field is required")
  }

  const user=await User.findOne({
    $or:[{ username },{ email }]
  })

  if(!user){
    throw new ApiError(404,"User not found")
  }

  const checkPassword=await user.isPasswordCorrect(password)
  if (!checkPassword){
    throw new ApiError(401,"Password is wrong")
  }

  const {accessToken,refreshToken}=await 
  generateAccessAndRefreshToken(user._id)

  const logged=await User.findById(user._id).select(
    "-password -refreshToken"
  )

  const options={
    httpOnly:true,
    secure:true
  }

  return res.
  status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:refreshToken,accessToken,logged
      },
      "User login successfully"
    )
  )
})

const logOutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
    
  )
  const options={
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,"User Logout Succesfully")
  )
})

const accessRefreshToken=asyncHandler(async(req,res)=>{
  try {
    const incomingRefreshToken=req.cookies.refreshToken||
    req.header.refreshToken
  
    if(!incomingRefreshToken){
      throw new ApiError(401,"Invalid access refresh Token")
    }
    const decodedToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_START
    )
  
    const user= await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401," Refresh Token not matched")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,refreshToken:newRefreshToken
        },
        "Access  Token Refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,"Invalid refresh Token")
  }

  
})

const changePassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body

  const user=await User.findById(req.user._id)
  const matchPassword=await user.isPasswordCorrect(oldPassword)
  if(!matchPassword){
    throw new ApiError(401,"old password not correct")

  }
  user.password=newPassword
  await user.save({validateBeforeSave:true})
  
  return res
  .status(200)
  .json(
    new ApiResponse(200
      ,{},"Password Change Successfully"
    )
  )
  
})

const getUserDetails=asyncHandler(async(req,res)=>{
  res.status(200)
  .json(
    new ApiResponse(
      200,req.user,"Current User Fetched"
    )
  )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body

  if(!fullName){
    throw new ApiError(401,"Mandatory Field is Required")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {
      new:true
    }
  ).select("-password")
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user,
      "Account Update successFully"
    )
  )
})

const updateAvatar=asyncHandler(async(req,res)=>{
  
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar Local Path is Missing")
  }

  const avatar=await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400,"Avatar Image is Missing")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true
    }
  )
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,user,"Avatar Upload Successfully"
    )
  ).select("-password")
})

const updateUserName=asyncHandler(async(req,res)=>{
  
  const{currentUserName,newUserName}=req.body
  const user= await User.findById(req.user?._id)
  if(!user){
   throw new ApiError(401,"User not Found")
  }
  const checkExistedUserName=await User.findOne({
    username:newUserName
  })
  // console.log("exites",checkExistedUserName)
  if (checkExistedUserName){
    throw new ApiError(401,"Username already occupied,Please use another name");
    
  }
  user.username=newUserName
  await user.save({validateBeforeSave:true})

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"UserName Changes")
  )
})

const followDetails=asyncHandler(async(req,res)=>{
  const {username}=req.params

  if(!username?.trim()){
    throw new ApiError(400,"Username not find")
  }
  console.log("user",username)
  const userDetails=await User.aggregate([
    {
      $match:{
        username:username
      }
    },
    {
      $lookup:{
        from:"followerdetails",
        localField:"_id",
        foreignField:"channel",
        as:"followers"
      }
    },
    {
      $lookup:{
        from:"followerdetails",
        localField:"_id",
        foreignField:"follower",
        as:"following"
      }
    },
    {
      $addFields:{
        followerCount:{
          $size:"$followers"
        },
        followingCount:{
          $size:"$following"
        },
        isFollowed:{
          $cond:{
            if:{$in:[req.user?._id,"$followers.follower"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        email:1,
        followers:1,
        following:1,
        followerCount:1,
        followingCount:1,
        isFollowed:1

      }
    }
  ])
  if(!userDetails?.length){
    throw new ApiError(404,"User Not Found")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,userDetails[0],"User Fetched Successfully"
    )
  )
})

export { registerUser,
        loginUser,
        logOutUser,
        accessRefreshToken,
        changePassword,
        getUserDetails,
      updateAccountDetails,
      updateAvatar,
    updateUserName,
  followDetails};
