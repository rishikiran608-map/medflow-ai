const supabase = require("../config/supabase");

const getQueue = async (req, res) => {
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .order("token_number", { ascending: true });

  if (error) return res.status(500).json(error);

  res.json(data);
};

const addToQueue = async (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_id,
    token_number,
    estimated_wait
  } = req.body;

  const { data, error } = await supabase
    .from("queue")
    .insert([
      {
        patient_id,
        doctor_id,
        appointment_id,
        token_number,
        estimated_wait
      }
    ])
    .select();

  if (error) return res.status(500).json(error);

  res.status(201).json(data);
};

module.exports = {
  getQueue,
  addToQueue,
};