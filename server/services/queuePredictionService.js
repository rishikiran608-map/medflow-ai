const { supabaseAdmin: supabase } = require("../config/supabase");
const { getMetadata } = require("./queueMetadataStore");

// Predicts waiting time for subsequent bookings based on active queue reasons
const calculateWaitingTime = async (doctor_id) => {
  // Query all active queue items (excluding completed/cancelled/no-show)
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .eq("doctor_id", doctor_id)
    .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"]);

  if (error) throw error;

  const getConsultationDuration = (reason = "") => {
    const text = reason.toLowerCase();
    if (
      text.includes("emergency") ||
      text.includes("surgery") ||
      text.includes("critical") ||
      text.includes("operation") ||
      text.includes("severe")
    ) {
      return 30; // 30 minutes for complex cases
    }
    if (
      text.includes("follow") ||
      text.includes("report") ||
      text.includes("regular") ||
      text.includes("checkup")
    ) {
      return 8; // 8 minutes for quick checks
    }
    return 12; // 12 minutes standard
  };

  let totalWait = 0;
  data.forEach((item) => {
    const meta = getMetadata(item.id);
    totalWait += getConsultationDuration(meta.reason || "");
  });

  return {
    patientsWaiting: data.length,
    estimatedWait: totalWait,
    doctorWorkloadMinutes: totalWait,
    delayProbability: totalWait > 60 ? "High" : totalWait > 24 ? "Medium" : "Low",
  };
};

// Calculates dynamic, traffic-aware travel duration and ETA
const calculateTravelETA = (travelMode, distance) => {
  let speedKmh = 30; // default speed
  let trafficDelayMins = 0;

  switch (travelMode) {
    case "Walking":
      speedKmh = 5;
      trafficDelayMins = 0;
      break;
    case "Bicycling":
      speedKmh = 15;
      trafficDelayMins = 2;
      break;
    case "Transit": // public bus/metro
      speedKmh = 20;
      trafficDelayMins = 5; // transit wait average
      break;
    case "Driving":
      speedKmh = 40;
      // Simulate traffic delay based on time of day (rush hour simulation)
      const currentHour = new Date().getHours();
      if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
        trafficDelayMins = 12; // heavy rush hour delay
      } else {
        trafficDelayMins = 4; // off-peak delay
      }
      break;
  }

  // Duration in minutes = (distance / speed) * 60 + trafficDelay
  const durationMinutes = Math.round((distance / speedKmh) * 60 + trafficDelayMins);
  const etaTimestamp = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  return {
    durationMinutes,
    etaTimestamp,
    trafficDelayMins
  };
};

module.exports = {
  calculateWaitingTime,
  calculateTravelETA,
};