const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  verifyPassword,
} = require("../controllers/authController");

const verifyPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many verification attempts" },
});

router.post("/register", register);
router.post("/login", login);
router.post("/verify-password", verifyPasswordLimiter, verifyPassword);

module.exports = router;