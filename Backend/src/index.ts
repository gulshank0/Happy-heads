import "dotenv/config";
import express from "express";
//import cors from "cors";

  const app = express();


//app.use(cors());

  // Example API routes
  app.get("/api/ping", (req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });


  app.get("/api", (req, res) => {
    res.json({ message: "API is running" });
  });


  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});