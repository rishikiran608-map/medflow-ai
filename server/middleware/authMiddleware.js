const { supabase } = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("=================================");
    console.log("✅ Auth Middleware Executed");

    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header format");
      return res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
    }

    // Extract and trim token
    const token = authHeader.replace("Bearer ", "").trim();

    // Check for empty or literal "null"/"undefined" tokens sent from client
    if (!token || token === "null" || token === "undefined") {
      console.log("❌ Extracted token is empty, null, or undefined string");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token",
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.log("❌ Supabase Auth error:", error?.message || "User not found");
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid token",
        error: error?.message || "Unauthorized"
      });
    }

    // Attach user to request
    req.user = data.user;

    console.log("✅ Authentication Successful. User ID:", req.user.id);
    console.log("=================================");

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = authMiddleware;