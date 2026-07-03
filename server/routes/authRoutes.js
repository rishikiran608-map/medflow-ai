const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-password", verifyPassword);

module.exports = router;