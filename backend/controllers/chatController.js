import Chat from "../models/Chat.js";

// Get or create a chat
export const getOrCreateChat = async (req, res) => {
  const { userId, userType, otherId, otherType } = req.body;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, otherId] },
    })
      .populate("participants")
      .populate("messages.sender");

    if (!chat) {
      chat = new Chat({
        participants: [userId, otherId],
        participantsModel: [
          userType === "student" ? "students" : "instructors",
          otherType === "student" ? "students" : "instructors",
        ],
        messages: [],
      });
      await chat.save();
      await chat.populate("participants");
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("getOrCreateChat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  const { chatId, senderId, senderModel, text } = req.body;

  if (!text) return res.status(400).json({ message: "Message cannot be empty" });

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const message = { sender: senderId, senderModel, text };
    chat.messages.push(message);
    await chat.save();
    await chat.populate("messages.sender");

    res.status(200).json(chat);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get chat by ID
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate("participants")
      .populate("messages.sender");

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.status(200).json(chat);
  } catch (err) {
    console.error("getChatById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all chats for user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.params.userId })
      .populate("participants")
      .populate("messages.sender")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    console.error("getUserChats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
