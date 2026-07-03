const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getDoctors,
  addDoctor,
} = require("../controllers/doctorController");

// Public: anyone can view doctors
router.get("/", getDoctors);

// Protected: only authenticated users can add doctors
router.post("/", authMiddleware, addDoctor);

module.exports = router;