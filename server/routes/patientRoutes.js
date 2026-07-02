const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

router.get("/", authMiddleware, getPatients);
router.post("/", authMiddleware, addPatient);
router.put("/:id", authMiddleware, updatePatient);
router.delete("/:id", authMiddleware, deletePatient);

module.exports = router;