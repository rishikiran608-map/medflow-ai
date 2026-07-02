const express = require("express");
const router = express.Router();

const {
  getQueue,
  addToQueue,
  predictQueue,
} = require("../controllers/queueController");

router.get("/", getQueue);
router.post("/", addToQueue);
router.get("/predict/:doctorId", predictQueue);

module.exports = router;