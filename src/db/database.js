import mongoose from "mongoose"
import { dbName } from "../constant.js"
import dotenv from "dotenv"
dotenv.config();
const connectDB=async()=>{
    try {
        const connectionIn=await mongoose.connect(`${process.env.MONGODB_URL}/${dbName}`)
        console.log(`Mongoose Connected :${connectionIn.connection.host} `)
    } catch (error) {
        console.log("MongoDBs connection error",error)
        process.exit(1)
    }
}

export default connectDB