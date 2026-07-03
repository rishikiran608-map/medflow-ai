const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getDoctors,
  createDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

// Public: anyone can view doctors
router.get("/", getDoctors);

// Protected (Admin only checked inside controller):
router.post("/", authMiddleware, createDoctor);
router.delete("/:id", authMiddleware, deleteDoctor);

module.exports = router;