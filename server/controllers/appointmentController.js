const supabase = require("../config/supabase");

const getAppointments = async (req, res) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
};

const addAppointment = async (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    status,
    notes,
  } = req.body;

  const { data, error } = await supabase
    .from("appointments")
    .insert([
      {
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        status,
        notes,
      },
    ])
    .select();

  if (error) return res.status(500).json(error);

  res.status(201).json(data);
};

module.exports = {
  getAppointments,
  addAppointment,
};