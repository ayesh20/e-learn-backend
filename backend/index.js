import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import cors from "cors";
import userRouter from "./Routers/userRouter.js"
import instructorRouter from "./routers/instructorRouter.js"
import courseRouter from "./routers/courseRouter.js"
import studentRouter from "./routers/studentRouter.js"
import enrollmentRouter from "./routers/enrollmentRouter.js"

import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()


const app = express()
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
    credentials: true
}));

app.use(bodyParser.json())

app.use(
    (req,res,next)=>{

        const value = req.header("Authorization")
        if(value != null){
        const token = value.replace("Bearer ","")
         jwt.verify(token,
            process.env.JWT_SECRET,
            (err,decoded) =>{

                if(decoded == null){
                    res.status(403).json({
                    message : "invalid user"
                })
                }else{
                    req.user = decoded
                    next()
                }
            }

         )
        }else{
        next()//pass the relared one
        }
    }
)


const connectionString = process.env.MONGO_URI


mongoose.connect(connectionString).then(
    ()=>{
        console.log("Connected to database")
    }
).catch(
    (error)=>{
        console.log("Failed to connect to the database:", error.message)
    }
)




app.use("/api/users", userRouter)
app.use("/api/instructors", instructorRouter)
app.use("/api/courses", courseRouter)
app.use("/api/students", studentRouter)
app.use("/api/enrollments", enrollmentRouter)





app.listen(5000, 
   ()=>{
       console.log("server started")
   }
)
