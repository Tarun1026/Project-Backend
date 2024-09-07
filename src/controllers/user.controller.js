import { asyncHandler } from "../utils/asynchronousHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

export { registerUser };
