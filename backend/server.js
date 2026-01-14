// API server with auth, chat, and notifications.
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import ObjectItem from "./models/ObjectItem.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import { requireAuth } from "./middleware/requireAuth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function signToken(user) {
  return jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const ALLOWED_EMAIL_DOMAIN = "@ipvc.pt";

const hasAllowedDomain = (email) => {
  if (typeof email !== "string") return false;
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
};


// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }
        if (!hasAllowedDomain(email)) {
      return res.status(400).json({ message: "O registo requer um email @ipvc.pt" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email já registado" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: "Erro ao registar utilizador" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    const token = signToken(user);
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: "Erro ao iniciar sessão" });
  }
});

// Objects
app.get("/api/objects", async (_req, res) => {
  const items = await ObjectItem.find().sort({ createdAt: -1 }).populate("owner", "name email");
  res.json(items);
});

app.post("/api/objects", requireAuth, async (req, res) => {
  try {
    const { title, description, location, category, type, date, photoUrl } = req.body;
    if (!title || !description || !location || !type || !date) {
      return res.status(400).json({ message: "Campos obrigatórios em falta" });
    }
    const item = await ObjectItem.create({
      title,
      description,
      location,
      category,
      type,
      date,
      photoUrl,
      owner: req.user.sub,
    });
    const populated = await ObjectItem.findById(item._id).populate("owner", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar anúncio" });
  }
});

app.get("/api/objects/:id", async (req, res) => {
  try {
    const item = await ObjectItem.findById(req.params.id).populate("owner", "name email");
    if (!item) {
      return res.status(404).json({ message: "Objeto não encontrado" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Erro ao obter anúncio" });
  }
});

app.delete("/api/objects/:id", requireAuth, async (req, res) => {
  try {
    const item = await ObjectItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Objeto não encontrado" });
    }
    if (item.owner?.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Sem permissões para remover este anúncio" });
    }
    await Message.deleteMany({ objectId: item._id });
    await item.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erro ao remover anúncio" });
  }
});

// Messages
app.get("/api/objects/:id/messages", requireAuth, async (req, res) => {
  try {
    const messages = await Message.find({ objectId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erro ao obter mensagens" });
  }
});

// Conversation list for current user
app.get("/api/chats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    const ownedObjects = await ObjectItem.find({ owner: userId }).select("title type owner").lean();
    const ownedMap = new Map(ownedObjects.map((o) => [o._id.toString(), o]));

    const relatedMessages = await Message.find({
      $or: [{ userId }, { recipientId: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const conversations = new Map();

    const addConversation = (objectId, title, type, owner) => {
      const key = objectId.toString();
      if (!conversations.has(key)) {
        conversations.set(key, {
          objectId: key,
          title,
          type,
          owner,
          participants: new Map(),
          lastMessage: null,
        });
      }
      return conversations.get(key);
    };

    relatedMessages.forEach((msg) => {
      const objId = msg.objectId?.toString();
      if (!objId) return;
      const owned = ownedMap.get(objId);
      const convo = addConversation(objId, owned?.title, owned?.type, owned?.owner);
      const senderId = msg.userId?.toString();
      const recipientId = msg.recipientId?.toString();
      if (senderId) convo.participants.set(senderId, { id: senderId, name: msg.userName, email: msg.userEmail });
      if (recipientId && !convo.participants.has(recipientId)) {
        convo.participants.set(recipientId, { id: recipientId });
      }
      if (!convo.lastMessage || new Date(msg.createdAt) > new Date(convo.lastMessage.createdAt)) {
        convo.lastMessage = msg;
      }
    });

    const missingIds = new Set();
    conversations.forEach((convo) => {
      convo.participants.forEach((participant) => {
        if (participant.id && !participant.name && !participant.email) {
          missingIds.add(participant.id.toString());
        }
      });
    });
    if (missingIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(missingIds) } })
        .select("name email")
        .lean();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));
      conversations.forEach((convo) => {
        convo.participants.forEach((participant) => {
          if (participant.id && !participant.name && !participant.email) {
            const user = userMap.get(participant.id.toString());
            if (user) {
              participant.name = user.name;
              participant.email = user.email;
            }
          }
        });
      });
    }

    const list = Array.from(conversations.values())
      .map((c) => ({
        objectId: c.objectId,
        title: c.title,
        type: c.type,
        owner: c.owner,
        participants: Array.from(c.participants.values()),
        lastMessage: c.lastMessage,
      }))
      .sort((a, b) => {
        const aDate = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bDate = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bDate - aDate;
      });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Erro ao listar conversas" });
  }
});

app.delete("/api/chats/:objectId", requireAuth, async (req, res) => {
  try {
    const { objectId } = req.params;
    const userId = req.user.sub;
    const isOwner = await ObjectItem.exists({ _id: objectId, owner: userId });
    const hasMessages = await Message.exists({
      objectId,
      $or: [{ userId }, { recipientId: userId }],
    });
    if (!isOwner && !hasMessages) {
      return res.status(403).json({ message: "Sem permissões para remover esta conversa" });
    }
    if (isOwner) {
      await Message.deleteMany({ objectId });
    } else {
      await Message.deleteMany({ objectId, $or: [{ userId }, { recipientId: userId }] });
    }
    await Notification.deleteMany({ userId, "data.objectId": objectId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erro ao remover conversa" });
  }
});

// Notifications
app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Erro ao listar notificacoes" });
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.sub });
    if (!notification) {
      return res.status(404).json({ message: "Notificacao nao encontrada" });
    }
    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Erro ao atualizar notificacao" });
  }
});

app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.sub, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erro ao atualizar notificacoes" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error("Unauthorized"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  // Allow personal notifications by user id
  if (socket.user?.sub) {
    socket.join(socket.user.sub.toString());
  }

  socket.on("join", (objectId) => {
    if (objectId) {
      socket.join(objectId);
    }
  });

  socket.on("message", async ({ objectId, content, recipientId }) => {
    if (!objectId || !content?.trim()) return;
    try {
      const userDoc = await User.findById(socket.user.sub);
      if (!userDoc) return;
      const listing = await ObjectItem.findById(objectId);
      if (!listing) return;

      const isOwner = listing.owner && listing.owner.toString() === userDoc._id.toString();
      const targetUserId = isOwner ? recipientId : listing.owner?.toString();
      if (isOwner && !targetUserId) {
        return; // Owners must target a specific user
      }

      const message = await Message.create({
        objectId,
        content: content.trim(),
        userId: userDoc._id,
        userName: userDoc.name,
        userEmail: userDoc.email,
        recipientId: targetUserId,
      });
      let notificationPayload = null;
      if (targetUserId && targetUserId.toString() !== userDoc._id.toString()) {
        const notification = await Notification.create({
          userId: targetUserId,
          type: "message",
          title: "Nova mensagem",
          body: `${userDoc.name} enviou-te uma mensagem`,
          data: {
            objectId: objectId.toString(),
            messageId: message._id.toString(),
            senderId: userDoc._id.toString(),
          },
        });
        notificationPayload = {
          _id: notification._id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        };
      }
      const payload = {
        _id: message._id,
        objectId: message.objectId,
        content: message.content,
        userId: message.userId,
        userName: message.userName,
        userEmail: message.userEmail,
        recipientId: message.recipientId,
        createdAt: message.createdAt,
      };
      const targets = [objectId.toString(), userDoc._id.toString()];
      if (targetUserId) targets.push(targetUserId.toString());
      io.to(targets).emit("message", payload);
      if (notificationPayload && targetUserId) {
        io.to(targetUserId.toString()).emit("notification", notificationPayload);
      }
    } catch (err) {
      // Optionally log errors
    }
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
