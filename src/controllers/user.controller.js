import { asyncHandler } from "../utils/asynchronousHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken=async(userId)=>{
  try {
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken
    const refreshToken=user.generateRefreshToken

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

  if(!username||email){
    throw new ApiError(400,"Field is required")
  }

  const findUser=await User.findOne({
    $or:[{ username },{ email }]
  })

  if(!findUser){
    throw new ApiError(404,"User not found")
  }

  const checkPassword=await findUser.isPasswordCorrect(password)
  if (!checkPassword){
    throw new ApiError(401,"Password is wrong")
  }

  const {accessToken,refreshToken}=await 
  generateAccessAndRefreshToken(findUser._id)

  const logged=await User.findById(findUser._id).select(
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
        findUser:refreshToken,accessToken,logged
      },
      "User login successfully"
    )
  )
})

const logOutUser=asyncHandler(async(req,res)=>{
  User.findByIdAndUpdate(
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

export { registerUser,loginUser,logOutUser };
