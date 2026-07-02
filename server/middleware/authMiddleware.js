const supabase = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  console.log("✅ Auth middleware executed");
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  req.user = data.user;
  next();
};

module.exports = authMiddleware;