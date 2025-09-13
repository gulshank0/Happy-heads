import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import websocketService from "./services/websocketService";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import messageRoutes from "./routes/messages";
import matchingRoutes from "./routes/matchingRoutes";
import postsRouter from "./routes/posts";
import messagesRouter from "./routes/messages";
import usersRouter from "./routes/users";
import "./config/passport";

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/avatars");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Create uploads directory for posts
const postsUploadsDir = path.join(__dirname, "../uploads/posts");
if (!fs.existsSync(postsUploadsDir)) {
  fs.mkdirSync(postsUploadsDir, { recursive: true });
}

// Serve post images
app.use("/uploads/posts", express.static(postsUploadsDir));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers["user-agent"]?.substring(0, 100),
    authenticated: !!req.user,
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/posts", postsRouter);
app.use("/api", messagesRouter); // This makes /api/conversations available
app.use("/users", usersRouter); // This makes /users/search-messaging available

// Alternative route mounting for backward compatibility
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/users", userRoutes); // Alternative mounting

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    onlineUsers: websocketService.getConnectedUserCount(),
  });
});

// Avatar upload endpoint - move this to users routes for better organization
app.post("/users/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate the avatar URL
    const avatarUrl = `http://localhost:${
      process.env.PORT || 8000
    }/uploads/avatars/${req.file.filename}`;

    console.log("Avatar uploaded successfully:", {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: avatarUrl,
    });

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: "Avatar upload failed" });
  }
});

// Error handling middleware for multer errors
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    }
  }
  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({ error: "Only image files are allowed" });
  }
  next(error);
});

// Error handling middleware
app.use(
  (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize WebSocket service after all routes
websocketService.initialize(server);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  await prisma.$disconnect();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  await prisma.$disconnect();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}/ws`);
  console.log(`🌐 HTTP server ready at http://localhost:${PORT}`);
});

export default app;