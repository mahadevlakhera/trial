import { Router } from "express";
import { loginuser, logoutuser, registerUser , refreshAccessToken} from "../controllers/user.controller.js";
import {upload} from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT , logoutuser);
router.route("/refresh-token").post(refreshAccessToken)

export default router;
         