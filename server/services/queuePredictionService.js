const supabase = require("../config/supabase");

const calculateWaitingTime = async (doctor_id) => {
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .eq("doctor_id", doctor_id)
    .eq("queue_status", "Waiting");

  if (error) throw error;

  const averageConsultationTime = 12; // minutes

  const estimatedWait = data.length * averageConsultationTime;

  return {
    patientsWaiting: data.length,
    averageConsultationTime,
    estimatedWait,
  };
};

module.exports = {
  calculateWaitingTime,
};