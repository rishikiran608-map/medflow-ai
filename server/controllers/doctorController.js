const { supabaseAdmin: supabase } = require("../config/supabase");

// Get all doctors
const getDoctors = async (req, res) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
};

// Onboard a new Doctor (Admins only)
const createDoctor = async (req, res) => {
  // Ensure requesting user is an admin
  if (req.user.role !== "Hospital Admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }

  const {
    full_name,
    specialization,
    experience,
    qualification,
    phone,
    email,
    password,
    consultation_fee
  } = req.body;

  try {
    // 1. Create the user in Supabase Auth using the admin API
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "Doctor",
        full_name,
        phone
      }
    });

    if (authErr) {
      return res.status(400).json({ success: false, message: authErr.message });
    }

    const doctorId = authUser.user.id;

    // 2. Save inside users table
    const { error: dbUserErr } = await supabase.from("users").insert([
      {
        id: doctorId,
        full_name,
        email,
        role: "Doctor",
        phone
      }
    ]);

    if (dbUserErr) {
      console.error("Failed to insert user details:", dbUserErr);
      return res.status(400).json({ success: false, message: dbUserErr.message });
    }

    // 3. Save inside doctors profile table
    const { error: docErr } = await supabase.from("doctors").insert([
      {
        id: doctorId,
        full_name,
        email,
        phone,
        specialization,
        experience: Number(experience),
        qualification,
        consultation_fee: Number(consultation_fee),
        available: true
      }
    ]);

    if (docErr) {
      console.error("Failed to insert doctor details:", docErr);
      return res.status(400).json({ success: false, message: docErr.message });
    }

    res.status(201).json({
      success: true,
      message: `Doctor ${full_name} onboarded successfully!`,
      doctor: { id: doctorId, full_name, email }
    });
  } catch (err) {
    console.error("createDoctor error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Offboard/Remove a Doctor (Admins only)
const deleteDoctor = async (req, res) => {
  // Ensure requesting user is an admin
  if (req.user.role !== "Hospital Admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }

  const { id } = req.params;

  try {
    // 1. Delete matching queue entries and appointments first to satisfy foreign keys
    await supabase.from("queue").delete().eq("doctor_id", id);
    await supabase.from("appointments").delete().eq("doctor_id", id);

    // 2. Delete doctor profile record
    const { error: docDelErr } = await supabase.from("doctors").delete().eq("id", id);
    if (docDelErr) return res.status(400).json({ success: false, message: docDelErr.message });

    // 3. Delete user record
    const { error: userDelErr } = await supabase.from("users").delete().eq("id", id);
    if (userDelErr) return res.status(400).json({ success: false, message: userDelErr.message });

    // 4. Delete the authentication user from Supabase Auth
    const { error: authDelErr } = await supabase.auth.admin.deleteUser(id);
    if (authDelErr) {
      console.warn("Auth user deletion warning (user might already be deleted):", authDelErr.message);
    }

    res.json({ success: true, message: "Doctor account offboarded successfully." });
  } catch (err) {
    console.error("deleteDoctor error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getDoctors,
  createDoctor,
  deleteDoctor,
};