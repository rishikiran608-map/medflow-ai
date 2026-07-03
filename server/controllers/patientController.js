const { supabaseAdmin: supabase } = require("../config/supabase");

// Get all patients
const getPatients = async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
};

// Add new patient
const addPatient = async (req, res) => {
  const { full_name, email, phone, age, gender, address } = req.body;

  const { data, error } = await supabase
    .from("patients")
    .insert([
      {
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone,
        age: req.body.age,
        gender: req.body.gender,
        address: req.body.address,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.status(201).json(data);
};
const updatePatient = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, age, gender, address } = req.body;

  const { data, error } = await supabase
    .from("patients")
    .update({
      full_name,
      email,
      phone,
      age,
      gender,
      address,
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
};
const deletePatient = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true,
    message: "Patient deleted successfully",
  });
};
module.exports = {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
};