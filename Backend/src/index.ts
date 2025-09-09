import "dotenv/config";
import express from "express";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import "./config/passport"; // Import passport configuration
import cors from "cors";


const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:8080", // Adjust as necessary
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.get("/user/data", (req, res) => {
  res.json({ message: "User data endpoint" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});