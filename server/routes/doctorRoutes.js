const express = require("express");
const router = express.Router();

const {
  getDoctors,
  addDoctor,
} = require("../controllers/doctorController");

router.get("/", getDoctors);
router.post("/", addDoctor);

module.exports = router;