import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Routers
import userRouter from "./routers/userRouter.js";
import instructorRouter from "./routers/instructorRouter.js";
import courseRouter from "./routers/courseRouter.js";
import studentRouter from "./routers/studentRouter.js";
import enrollmentRouter from "./routers/enrollmentRouter.js";
import profileRouter from "./routers/profileRouter.js";
import chatRoutes from "./routers/chatRoutes.js";
import passwordRoutes from "./routers/passwordRoutes.js"; // ✅ Added forgot password routes

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
  })
);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup upload directories and serve static files
const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads/courses"),
  path.join(__dirname, "uploads/profiles"),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created upload directory: ${dir}`);
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// JWT Authentication Middleware
app.use((req, res, next) => {
  const authHeader = req.header("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!decoded || err) {
        return res.status(403).json({ message: "Invalid user" });
      }
      req.user = decoded;
      next();
    });
  } else {
    next();
  }
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to database"))
  .catch((error) => console.log("❌ Failed to connect to the database:", error.message));

// Routers
app.use("/api/users", userRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/courses", courseRouter);
app.use("/api/students", studentRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRoutes);

// ✅ Forgot Password Routes
app.use("/api/password", passwordRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
