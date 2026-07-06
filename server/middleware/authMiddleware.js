const { supabase } = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  try {


    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith("Bearer ")) {

      return res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
    }

    // Extract and trim token
    const token = authHeader.replace("Bearer ", "").trim();

    // Check for empty or literal "null"/"undefined" tokens sent from client
    if (!token || token === "null" || token === "undefined") {

      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token",
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {

      return res.status(401).json({
        success: false,
        message: "Session expired or invalid token",
        error: error?.message || "Unauthorized"
      });
    }

    // Attach user to request
    req.user = data.user;
    
    // Set custom app role from user_metadata or query users database table
    if (data.user.user_metadata && data.user.user_metadata.role) {
      req.user.role = data.user.user_metadata.role;
    } else {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (dbUser) {
        req.user.role = dbUser.role;
      }
    }



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