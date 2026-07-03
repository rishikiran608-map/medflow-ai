const { supabaseAdmin: supabase } = require("../config/supabase");

const getDoctors = async (req, res) => {
  const { data, error } = await supabase
    .from("doctors")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
};

const addDoctor = async (req, res) => {
  const {
    full_name,
    specialization,
    experience,
    qualification,
    phone,
    email,
    consultation_fee
  } = req.body;

  const { data, error } = await supabase
    .from("doctors")
    .insert([
      {
        full_name,
        specialization,
        experience,
        qualification,
        phone,
        email,
        consultation_fee
      }
    ])
    .select();

  if (error) return res.status(500).json(error);

  res.status(201).json(data);
};

module.exports = {
  getDoctors,
  addDoctor,
};