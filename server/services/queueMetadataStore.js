/**
 * MedFlow AI - In-Memory Queue Metadata Store
 * Keyed by queue entry ID. Caches travel mode, ETA, and arrival timestamps.
 */
const store = new Map();
const patientHistories = new Map();

const setMetadata = (queueId, metadata) => {
  const current = store.get(queueId) || {};
  store.set(queueId, { ...current, ...metadata });
};

const getPatientHistory = (patientId) => {
  return patientHistories.get(patientId) || {
    medicalConditions: ["Allergy: Penicillin", "Hypertension (Stage 1)"],
    prescriptions: [
      { name: "Metformin 500mg", dosage: "1 tablet • Daily (Post-meal)" },
      { name: "Amlodipine 5mg", dosage: "1 tablet • Morning" }
    ],
    completedVisits: 4
  };
};

const updatePatientHistory = (patientId, history) => {
  const current = getPatientHistory(patientId);
  patientHistories.set(patientId, { ...current, ...history });
};

const getMetadata = (queueId, patientId) => {
  const meta = store.get(queueId) || {
    travel_mode: null,
    eta_minutes: null,
    eta_timestamp: null,
    arrived_at: null,
    no_show_warning_sent: false
  };

  const history = getPatientHistory(patientId);

  return { ...meta, ...history };
};

const clearMetadata = (queueId) => {
  store.delete(queueId);
};

module.exports = {
  setMetadata,
  getMetadata,
  clearMetadata,
  getPatientHistory,
  updatePatientHistory,
};
