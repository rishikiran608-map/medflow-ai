const { supabase, supabaseAdmin } = require("../config/supabase");

// Register User
const register = async (req, res) => {
  const { full_name, email, password, role, phone } = req.body;

  // Create user in Supabase Auth with metadata options
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        phone,
      },
    },
  });

  if (error) {
    return res.status(400).json(error);
  }

  // Save extra user details in users table
  const { error: dbError } = await supabaseAdmin
    .from("users")
    .insert([
      {
        id: data.user.id,
        full_name,
        email,
        role,
        phone,
      },
    ]);

  if (dbError) {
    return res.status(400).json(dbError);
  }

  // Create Patient/Doctor profile if applicable
  if (role === "Patient") {
    const { error: patientErr } = await supabaseAdmin
      .from("patients")
      .insert([
        {
          id: data.user.id,
          full_name,
          email,
          phone,
          age: 25, // Default/Placeholder age
          gender: "Male",
          address: "Address",
        },
      ]);
    if (patientErr) {
      console.error("Failed to create patient profile on signup:", patientErr);
      return res.status(400).json(patientErr);
    }
  } else if (role === "Doctor") {
    const { error: doctorErr } = await supabaseAdmin
      .from("doctors")
      .insert([
        {
          id: data.user.id,
          full_name,
          email,
          phone,
          specialization: "General Physician",
          experience: 5,
          qualification: "MBBS",
          consultation_fee: 500,
          available: true,
        },
      ]);
    if (doctorErr) {
      console.error("Failed to create doctor profile on signup:", doctorErr);
      return res.status(400).json(doctorErr);
    }
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

// Verify Password (Re-authentication)
const verifyPassword = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  res.status(200).json({
    success: true,
    message: "Identity verified"
  });
};

module.exports = {
  register,
  login,
  verifyPassword,
};