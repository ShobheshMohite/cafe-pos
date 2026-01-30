import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

console.log("Starting backend...");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "is set" : "MISSING !!!",
);

async function runMigrations() {
  try {
    console.log("Running Prisma generate...");
    await import("@prisma/client"); // force client load
    console.log("Running prisma migrate deploy...");
    const { execSync } = require("child_process");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    console.error("Backend will continue anyway...");
  }
}

runMigrations().then(() => {
  // continue starting server
  // your existing app.listen() code here
});

const app = express();

/* ================= PATH FIX (ESM) ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= SERVE FRONTEND ================= */
// THIS IS THE MISSING PIECE ✅
app.use(express.static(path.join(__dirname, "../../frontend")));

/* ================= HTTP + SOCKET ================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

/* Make io available in routes */
app.set("io", io);

/* ================= SOCKET EVENTS ================= */
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

/* ================= API ROUTES ================= */
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

/* ================= DEFAULT ROUTE ================= */
app.get("/", (req, res) => {
  res.send("☕ Cafe POS Backend Running");
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
