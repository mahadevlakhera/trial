import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models";
export const verifyJWT = asyncHandler(async(req , res , next) =>{

try {
       const token = req.cookies?.accesToken || req.header("Authorization")?. replace("Bearer ", "") //    req ke pass cookies ka accese hai kuki hmne he kra app.use(cookies) jo ki middleware hai ab hum cookies ko req, or res ke sth use kr skte hai   jo ye req.header  hai yeh custom header hai jo user bhejra ho 
       if (!token)
       {
        throw new ApiError (401 , "un authorized rewuest hai")
       }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if (!user)
       {
        throw new ApiError(401, "invalid Aceess token")
       }
       req.user = user;
       next()
} catch (error) {
      throw new ApiError(401,error?.message  || "invalid token")
}
})