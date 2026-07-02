const supabase = require("../config/supabase");

// Register User
const register = async (req, res) => {
  const { full_name, email, password, role, phone } = req.body;

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json(error);
  }

  // Save extra user details in users table
  const { error: dbError } = await supabase
    .from("users")
    .insert([
      {
        id: data.user.id,
        full_name,
        email,
        role,
        
      },
    ]);

  if (dbError) {
    return res.status(400).json(dbError);
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: data.user,
  });
};

// Login User
const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json(error);
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    session: data.session,
    user: data.user,
  });
};

module.exports = {
  register,
  login,
};