const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getQueue,
  addToQueue,
  predictQueue,
  getActiveQueue,
  updateOnTheWay,
  checkInPatient,
  callNextPatient,
  completeConsultation,
  cancelAppointment,
  getDoctorQueue,
  seedDemoData,
  registerWalkIn,
  getHealthProgress,
} = require("../controllers/queueController");

// Public queue routes
router.get("/", getQueue);
router.get("/predict/:doctorId", predictQueue);
router.post("/seed-demo", authMiddleware, seedDemoData);

// Protected queue routes
router.get("/active", authMiddleware, getActiveQueue);
router.get("/doctor", authMiddleware, getDoctorQueue);
router.get("/health-progress", authMiddleware, getHealthProgress);
router.put("/on-the-way", authMiddleware, updateOnTheWay);
router.put("/check-in", authMiddleware, checkInPatient);
router.put("/call-next", authMiddleware, callNextPatient);
router.put("/complete/:id", authMiddleware, completeConsultation);
router.put("/cancel/:id", authMiddleware, cancelAppointment);
router.post("/walk-in", authMiddleware, registerWalkIn);
router.post("/", authMiddleware, addToQueue);

module.exports = router;