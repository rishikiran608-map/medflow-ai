const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./config/supabase");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const queueRoutes = require("./routes/queueRoutes");
const authRoutes = require("./routes/authRoutes");




const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/auth", authRoutes);
// Temporary testing routes
app.get("/supabase-test", async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

app.post("/supabase-test", async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .insert([
      {
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone,
        age: req.body.age,
        gender: req.body.gender,
        address: req.body.address,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 MedFlow AI Backend Running Successfully",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});