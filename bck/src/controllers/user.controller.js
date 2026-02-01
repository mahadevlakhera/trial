
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessandRefreshTokens = async(userId)=>{   // accese token or refresh token ggenrate kr ra yeh jo hmne user._id di woh recive lr ra parameter se
   try {
     const user= await User.findById(userId)  //  yeh usser id har mongoose element ko milti hai or unique hoti hai is chkr mai user ke pass is userid ka pura data hai
     const accesToken = user.generateAccessToken();  // ab accestoken genrate huwa user data ka usko accetoken mai dal doh
     const refreshToken = user.generateRefreshToken();
     
     user.refreshToken = refreshToken   // database mai daldiya refreshtoken is refreshtoken ne user ke andar jo refresh token tha usko change kra hai
     await user.save({validateBeforeSave: false})  // or yha save kr diya save lga ke
return {accesToken , refreshToken}   //accese token genrate kr diya

   } catch (error) {
     throw new ApiError (500, " something went wrong while genrating refresh token ")
   }
}
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    //  agar data base mai username ya email match huwa toh us aadmi ka sara data mil jayega  existeduser ko - Agar koi document mil gaya, to wo poora user document return karega (schema ke saare fields ke saath)

    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;   /// image ka local path avatarlocalpath ko mil gya 
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({              // User  mongoose schema ka model hai   jis se yeh schema se compare bhi kr ra hai uske baad mongo db mai save kr dega 
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(  //   pswd or refresh chod ke sb dai doh is _id wale usesr ka 
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});


const loginuser = asyncHandler(async(req,res)=>
{
     const {email, username , password}= req.body;
     if(!(email || username))
      {
             throw new ApiError (404 , "enter email or username ");
     }

    const user= await User.findOne({ $or:[{email},{username}] }) //  iska mtlb hai agr  ddatabse mai email ya username honge toh dega or jo bhi data base mai hai woh bhi user mai dal dega findone lga loh kuki upr consition hai ki agar user email exsit krti hai tb yeh wala run oga 
    if (!user)
    {
      throw new ApiError(404 ,"user or emailnot found")
    }
    

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid)
    {
      throw new ApiError(401, "paswd incrt does not exist")
    }

   const {accessToken , refreshToken} = await generateAccessandRefreshTokens(user._id)
       const loggedInUser = await User.findById(user._id).select("-password -refreshToken") /// ye infor hum user ko bhej re 

        const options = {    // jab bhi cokies bnate hai toh options krke likh te hai yeh obj hota hai 
          httpOnly: true,   // yeh bta raha hai ki isko client frontend dekh skte hai modifynhi kr sakte sirf backend krega
          secure: true
        }
        return res
        .status(200)
        .cookie("accesToken",accessToken,options)   // hum cookies ka istemal isliye kr pare bina import ke kuki hmne app.js mai jo ki middleware hai wha hmne cookies use kra hai ab hum yha  req or , res ke sth ya midddleware kesth use krlaite hai
        .cookie("refreshToken",refreshToken, options)
        .json(
          new ApiResponse(
            200,{
              user:loggedInUser, accessToken ,refreshToken
            },
            "User logged In succesfully"
          )
        )
      })

  const logoutuser = asyncHandler( async (req, res) =>
  {
    User.findByIdAndUpdate(req.user._id,
      {
        $set: {
          refreshToken: undefined
        }
      },
      {
        new: true
      }
    )
     const options = {
            httpOnly: true,
            secure:true
     }
     return res .status(200).clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{},"user logged out")

     )
     
  })


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser , loginuser , logoutuser , refreshAccessToken};
