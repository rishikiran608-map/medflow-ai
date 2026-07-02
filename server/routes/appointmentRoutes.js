const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAppointments,
  addAppointment,
} = require("../controllers/appointmentController");

router.get("/", authMiddleware, getAppointments);
router.post("/", authMiddleware, addAppointment);

module.exports = router;