const express = require("express");
const router = express.Router();

const {
  getQueue,
  addToQueue,
  predictQueue,
} = require("../controllers/queueController");

// Get all queue entries
router.get("/", getQueue);

// Add patient to queue
router.post("/", addToQueue);

// AI Queue Prediction
router.get("/predict/:doctorId", predictQueue);

module.exports = router;