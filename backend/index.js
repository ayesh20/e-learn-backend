import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routers/userRouter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(bodyParser.json());

// JWT Auth middleware
app.use((req, res, next) => {
    const value = req.header("Authorization");
    if (value != null) {
        const token = value.replace("Bearer ", "");
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (decoded == null) {
                res.status(403).json({ message: "invalid user" });
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        next();
    }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to database"))
    .catch(() => console.log("Failed to connect to the database"));

// Routes

app.use("/api/users", userRouter);
;

// Start server
app.listen(5000, () => console.log("Server started on port 5000"));
