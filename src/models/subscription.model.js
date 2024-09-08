import mongoose,{Schema} from "mongoose";

const followSchema=new Schema({

    follower:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
})

export const Follower=mongoose.model('FollowerDetail',followSchema)