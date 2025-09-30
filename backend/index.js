import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import userRouter from "./routers/userRouter.js";
import instructorRouter from "./routers/instructorRouter.js";
import courseRouter from "./routers/courseRouter.js";
import studentRouter from "./routers/studentRouter.js";
import enrollmentRouter from "./routers/enrollmentRouter.js";
import profileRouter from "./routers/profileRouter.js";
import chatRoutes from "./routers/chatRoutes.js";
import contactRouter from "./routers/contactRouter.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // NEW: For file system operations
// import multer from "multer"; // NOTE: Multer is only used in courseRouter

// For ES modules, define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
  })
);

// Middleware for parsing JSON (will be bypassed for Multer routes)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// NEW: Setup directories and serve static files
const uploadDirs = [path.join(__dirname, 'uploads'), path.join(__dirname, 'uploads/courses'), path.join(__dirname, 'uploads/profiles')];

// Ensure upload directories exist
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created upload directory: ${dir}`);
    }
});

// Serve static files (images) from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // <--- NEW: Static route for serving images

// JWT Authentication Middleware
app.use((req, res, next) => {
  const value = req.header("Authorization");
  if (value) {
    const token = value.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!decoded || err) {
        return res.status(403).json({
          message: "Invalid user",
        });
      }
      req.user = decoded;
      next();
    });
  } else {
    next(); // Continue if no token
  }
});

// MongoDB Connection
const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => {
    console.log("✅ Connected to database");
  })
  .catch((error) => {
    console.log("❌ Failed to connect to the database:", error.message);
  });

// Routers
app.use("/api/users", userRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/courses", courseRouter);
app.use("/api/students", studentRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/contact", contactRouter );

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});