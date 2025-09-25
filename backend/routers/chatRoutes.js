import express from "express";
import { getChatById, sendMessage, getUserChats,getOrCreateChat } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:userId", getUserChats);
router.get("/chat/:chatId", getChatById); // ✅ new
router.post("/get-or-create", getOrCreateChat);
router.post("/send", sendMessage);


export default router;
