const { supabaseAdmin: supabase } = require("../config/supabase");
const { getMetadata } = require("./queueMetadataStore");

// Predicts waiting time for subsequent bookings based on active queue factors
const calculateWaitingTime = async (doctor_id) => {
  // 1. Query all active queue items for this doctor
  const { data: queueEntries, error } = await supabase
    .from("queue")
    .select("*, doctors(*)")
    .eq("doctor_id", doctor_id)
    .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
    .order("token_number", { ascending: true });

  if (error) throw error;
  if (!queueEntries || queueEntries.length === 0) {
    return {
      patientsWaiting: 0,
      estimatedWait: 0,
      estimatedConsultationStart: new Date().toISOString(),
      confidence: 95,
      delayProbability: "Low",
      hasEmergency: false
    };
  }

  // 2. Load Doctor profile to check custom average consult time (default 15)
  const doctor = queueEntries[0].doctors || {};
  const baseConsultDuration = doctor.avg_consultation_time || 15;

  let totalWait = 0;
  let hasEmergency = false;
  let delayMinutes = 0;

  // 3. Process each patient in queue
  for (const item of queueEntries) {
    let multiplier = 1.0;
    
    // Fetch detailed metadata/EHR history
    const meta = await getMetadata(item.id, item.patient_id);
    const reason = (meta.reason || "").toLowerCase();
    
    // A. Appointment Type complexity adjustments
    if (reason.includes("emergency") || reason.includes("surgery") || reason.includes("critical")) {
      multiplier = 2.0; // doubles the consult time
      hasEmergency = true;
    } else if (reason.includes("follow") || reason.includes("report") || reason.includes("refill") || reason.includes("quick")) {
      multiplier = 0.6; // shorter checkup
    }

    // B. Patient History complexity (multiple medical conditions)
    const conditionsCount = (meta.medicalConditions || []).length;
    if (conditionsCount > 2) {
      multiplier += 0.2; // 20% delay for complex medical histories
    }

    const patientDuration = Math.round(baseConsultDuration * multiplier);
    totalWait += patientDuration;

    // C. Check current session delays (if doctor is actively in consultation)
    if (item.queue_status === "In Consultation") {
      const startTime = new Date(item.updated_at).getTime();
      const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);
      
      // If elapsed time exceeds predicted consultation time, add difference to delay
      if (elapsedMinutes > patientDuration) {
        delayMinutes += (elapsedMinutes - patientDuration);
      }
    }
  }

  // Add active delays
  totalWait += delayMinutes;

  // 4. Calculate Confidence Score
  // Base confidence is 95%. Reduces with queue length (increasing variance) and emergency cases.
  let confidence = 95 - (queueEntries.length * 3);
  if (hasEmergency) confidence -= 10;
  if (delayMinutes > 15) confidence -= 5;
  confidence = Math.max(50, Math.min(98, confidence)); // clamp between 50% and 98%

  // 5. Calculate Consultation Start
  const estimatedConsultationStart = new Date(Date.now() + totalWait * 60 * 1000).toISOString();

  return {
    patientsWaiting: queueEntries.length,
    estimatedWait: totalWait,
    estimatedConsultationStart,
    confidence,
    delayProbability: totalWait > 45 ? "High" : totalWait > 20 ? "Medium" : "Low",
    hasEmergency,
    activeDelayMinutes: delayMinutes
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
    case "Transit":
      speedKmh = 20;
      trafficDelayMins = 5;
      break;
    case "Driving":
      speedKmh = 40;
      // Simulate traffic delay based on rush hour
      const currentHour = new Date().getHours();
      if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
        trafficDelayMins = 12;
      } else {
        trafficDelayMins = 4;
      }
      break;
  }

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