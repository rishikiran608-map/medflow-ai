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

  // Auto-provision demo accounts if they don't exist in Supabase yet
  const demoAccounts = {
    "admin@medflow.com": { password: "admin123", role: "Hospital Admin", name: "Admin Desk" },
    "doctor@medflow.com": { password: "doctor123", role: "Doctor", name: "Dr. Rajesh Kumar" },
    "patient@medflow.com": { password: "patient123", role: "Patient", name: "Patient Demo" }
  };

  if (demoAccounts[email] && password === demoAccounts[email].password) {
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email === email);

      if (!existing) {
        console.log(`Auto-provisioning demo account: ${email}`);
        const acc = demoAccounts[email];
        
        // 1. Create auth account
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: acc.role, full_name: acc.name }
        });

        if (!authErr && authUser?.user) {
          const userId = authUser.user.id;

          // 2. Insert into users table
          await supabaseAdmin.from("users").insert([{
            id: userId,
            full_name: acc.name,
            email,
            role: acc.role,
            phone: "9988776611"
          }]);

          // 3. Insert role-specific profile details
          if (acc.role === "Doctor") {
            await supabaseAdmin.from("doctors").insert([{
              id: userId,
              full_name: acc.name,
              email,
              phone: "9988776622",
              specialization: "Cardiology",
              experience: 12,
              qualification: "MD, DM",
              consultation_fee: 800,
              available: true
            }]);
          } else if (acc.role === "Patient") {
            await supabaseAdmin.from("patients").insert([{
              id: userId,
              full_name: acc.name,
              email,
              phone: "9988776633",
              age: 34,
              gender: "Male",
              address: "Mumbai, India"
            }]);
          }
        }
      } else {
        // Force reset the password to default to guarantee login success
        console.log(`Syncing demo account password to default: ${email}`);
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: password,
          user_metadata: { role: demoAccounts[email].role, full_name: demoAccounts[email].name }
        });
      }
    } catch (e) {
      console.warn("Demo auto-provisioning warning:", e.message);
    }
  }

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