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

// At the top of server.js, after your imports
console.log("Starting backend...");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "is set" : "MISSING !!!",
);

// Run migrations before starting the server
async function runMigrations() {
  try {
    console.log("Running Prisma generate...");
    // Prisma generate is a CLI command — run via child_process
    const { exec } = await import("node:child_process");
    const util = await import("node:util");
    const execPromise = util.promisify(exec.exec);

    await execPromise("npx prisma generate");
    console.log("Prisma generate completed.");

    console.log("Running prisma migrate deploy...");
    await execPromise("npx prisma migrate deploy");
    console.log("Migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message || err);
    console.error("Backend will continue anyway...");
  }
}

// Call it and then start the server
runMigrations()
  .then(() => {
    // Your existing server startup code here
    // e.g.
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal error during startup:", err);
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
