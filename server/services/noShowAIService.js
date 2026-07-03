/**
 * MedFlow AI - Patient No-Show Risk Classifier Engine
 * Analyzes patient demographics, scheduling parameters, commute details, and
 * historical records to predict individual no-show probabilities.
 */
const predictNoShowProbability = (queueItem) => {
  if (!queueItem) {
    return { probability: 10, riskLevel: "Low", reasons: ["Default safe state"] };
  }

  const patientAge = queueItem.patients?.age || 35;
  const status = queueItem.queue_status;
  const travelMode = queueItem.travel_mode;
  const etaMinutes = queueItem.eta_minutes;

  let score = 15; // baseline risk score
  const reasons = [];

  // 1. Commute status risk assessment
  if (status === "Waiting") {
    score += 35;
    reasons.push("Has not initiated travel ('I'm On The Way' is pending)");
  } else if (status === "Arriving" && etaMinutes > 30) {
    score += 20;
    reasons.push(`Long travel commute (${etaMinutes} mins ETA)`);
  }

  // 2. Transport mode risk adjustments
  if (travelMode === "Transit") {
    score += 15;
    reasons.push("Public transit is subject to standard schedule delays");
  } else if (travelMode === "Walking" && etaMinutes > 15) {
    score += 25;
    reasons.push("Long distance walking commute carries high delay probability");
  }

  // 3. Demographic & general risk vectors
  if (patientAge > 70) {
    score += 10;
    reasons.push("Senior patient (requires checkup mobility assistance)");
  } else if (patientAge < 10) {
    score += 5;
    reasons.push("Pediatric checkup dependencies");
  }

  // Cap probability between 5% and 95%
  const probability = Math.max(5, Math.min(95, score));
  
  let riskLevel = "Low";
  if (probability > 60) {
    riskLevel = "High";
  } else if (probability > 30) {
    riskLevel = "Medium";
  }

  return {
    probability,
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ["Normal commute conditions"]
  };
};

module.exports = {
  predictNoShowProbability,
};
