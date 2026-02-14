import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ================= LOAD ROOT .ENV =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 IMPORTANT: load env from project ROOT
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const PORT = process.env.PORT || 5001;

// ================= START SERVER AFTER DB =================
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("DB Connection Failed:", err.message);
    process.exit(1);
  }
};

// ================= GLOBAL CRASH HANDLERS =================
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  process.exit(1);
});

// ================= BOOT =================
startServer();
