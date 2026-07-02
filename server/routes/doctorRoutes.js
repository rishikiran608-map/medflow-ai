const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getDoctors,
  addDoctor,
} = require("../controllers/doctorController");

router.get("/", authMiddleware, getDoctors);
router.post("/", authMiddleware, addDoctor);

module.exports = router;