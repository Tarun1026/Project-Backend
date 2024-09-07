import dotenv from "dotenv"
import connectDB from "./db/database.js"
import express from "express"
import { app } from "./app.js"
// const app=express()
dotenv.config({
    path:'./.env'
})
app.get('/',(req,res)=>{
    res.send("<h1>Hello backend</h1>")
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT||9000,()=>{
        console.log(`Port running on ${process.env.PORT}`)
    })
})
.catch((er)=>{
    console.log("mongo DBS failed ",er)
})