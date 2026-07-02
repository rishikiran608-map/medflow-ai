const supabase = require("../config/supabase");
const {
  calculateWaitingTime,
} = require("../services/queuePredictionService");

// Get Queue
const getQueue = async (req, res) => {
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .order("token_number");

  if (error) return res.status(500).json(error);

  res.json(data);
};


// Add Patient
const addToQueue = async (req, res) => {
 const {
  patient_id,
  doctor_id,
  token_number,
  estimated_wait,
  queue_status,
} = req.body;
  const { data, error } = await supabase
    .from("queue")
    .insert([
      {
        patient_id,
        doctor_id,
        token_number,
        estimated_wait,
        queue_status,
      },
    ])
    .select();

  if (error) return res.status(500).json(error);

  res.status(201).json(data);
};
const predictQueue = async (req, res) => {
  try {
    const result = await calculateWaitingTime(req.params.doctorId);

    res.json({
      success: true,
      prediction: result,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getQueue,
  addToQueue,
  predictQueue,
};