const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAppointments,
  addAppointment,
  makePayment,
} = require("../controllers/appointmentController");

router.get("/", authMiddleware, getAppointments);
router.post("/", authMiddleware, addAppointment);
router.put("/pay/:id", authMiddleware, makePayment);

module.exports = router;