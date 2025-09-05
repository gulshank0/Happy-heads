"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
//import cors from "cors";
const app = (0, express_1.default)();
//app.use(cors());
// Example API routes
app.get("/api/ping", (req, res) => {
    var _a;
    const ping = (_a = process.env.PING_MESSAGE) !== null && _a !== void 0 ? _a : "ping";
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
