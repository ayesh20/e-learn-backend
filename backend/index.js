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
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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

// Middleware for parsing JSON
app.use(bodyParser.json());

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

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
