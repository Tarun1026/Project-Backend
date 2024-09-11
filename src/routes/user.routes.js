import { Router } from "express";
import { loginUser, 
    logOutUser, 
    registerUser,
    accessRefreshToken, 
    changePassword, 
    getUserDetails, 
    updateAccountDetails, 
    updateAvatar, updateUserName, 
    followDetails } from "../controllers/user.controller.js";
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
router.route('/change-password').post(verifyJwt,changePassword)
router.route('/current-user-details').get(verifyJwt,getUserDetails)
router.route('/update-account-details').patch(verifyJwt,updateAccountDetails)
router.route('/update-avatar').patch(verifyJwt,upload.single('avatar'),updateAvatar)
router.route('/update-username').patch(verifyJwt,updateUserName)
router.route('/f/:username').get(verifyJwt,followDetails)


export default router