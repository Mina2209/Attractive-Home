import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api", (req, res) => {
  res.send("Hello from Express server!");
});

// Connect to MongoDB and Start Server
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect to MongoDB", err));
} else {
  console.log("MongoDB URI is not set. Skipping connection to MongoDB.");
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
