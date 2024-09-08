import { Router } from "express";
import { loginUser, logOutUser, registerUser,accessRefreshToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/authen.middleware.js";
const router=Router()

router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]
    ),
    registerUser
)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJwt,logOutUser)
router.route('/refresh-token').post(accessRefreshToken)

export default router