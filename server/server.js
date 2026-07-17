const express = require("express");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const supabase = require("./config/supabase");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orchestrationRoutes = require("./routes/orchestrationRoutes");
const errorHandler = require("./middleware/errorHandler");




const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: "Too many requests, please try again later." } }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orchestrate", orchestrationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 MedFlow AI Backend Running Successfully",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start the background No-Show Detection Service (Runs every 25s, expires in 3 mins for demo/showcase)
  const { startNoShowDetection } = require("./services/noShowService");
  startNoShowDetection(25000, 3);
});