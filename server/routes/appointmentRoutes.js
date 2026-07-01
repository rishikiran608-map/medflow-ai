const express = require("express");
const router = express.Router();

const {
  getAppointments,
  addAppointment,
} = require("../controllers/appointmentController");

router.get("/", getAppointments);
router.post("/", addAppointment);

module.exports = router;