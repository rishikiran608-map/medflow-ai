const express = require("express");
const router = express.Router();

const {
  getQueue,
  addToQueue,
} = require("../controllers/queueController");

router.get("/", getQueue);
router.post("/", addToQueue);

module.exports = router;