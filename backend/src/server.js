import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import authRoutes from "./routes/auth.routes.js";

// Only load .env in development (Render uses dashboard env vars)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting backend...");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "is set" : "MISSING !!!");

// ────────────────────────────────────────────────────────────────
// Run Prisma migrations safely before starting the server
// ────────────────────────────────────────────────────────────────
async function runMigrations() {
  try {
    console.log("Running Prisma generate...");
    const generateResult = await promisify(exec)("npx prisma generate");
    console.log("Prisma generate output:", generateResult.stdout.trim() || "Done");

    console.log("Running prisma migrate deploy...");
    const migrateResult = await promisify(exec)("npx prisma migrate deploy");
    console.log("Prisma migrate output:", migrateResult.stdout.trim() || "No pending migrations");

    console.log("Migrations completed successfully.");
  } catch (err) {
    console.error("Migration step failed:", err.message || err);
    console.error("Backend will continue starting anyway...");
  }
}

// ────────────────────────────────────────────────────────────────
// Main startup sequence
// ────────────────────────────────────────────────────────────────
async function startServer() {
  await runMigrations();

  const app = express();

  // Middleware
  app.use(cors({
    origin: "*", // Change to your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }));
  app.use(express.json());

  // Serve frontend static files (from monorepo structure)
  app.use(express.static(path.join(__dirname, "../../frontend")));

  // API routes
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/auth", authRoutes);

  // Health check / default route
  app.get("/", (req, res) => {
    res.send("☕ Cafe POS Backend Running");
  });

  // Catch-all for SPA routing (serve index.html for React/Vite/etc. if needed)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend", "index.html"));
  });

  // Create HTTP + Socket.IO server
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*", // Change to specific frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  // Make io available in routes if needed
  app.set("io", io);

  // Socket events
  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  // Start listening
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Primary URL: https://cafe-brewtopia-api-qsjq.onrender.com`);
  });
}

// Start everything
startServer().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});