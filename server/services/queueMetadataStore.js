/**
 * MedFlow AI - Queue Metadata & Patient EHR Store
 * Queue metadata: in-memory (ephemeral by nature)
 * Patient EHR: persisted to Supabase (survives server restart)
 */
const { supabaseAdmin } = require("../config/supabase");

// Queue metadata stays in-memory (ephemeral queue state)
const store = new Map();

const setMetadata = (queueId, metadata) => {
  const current = store.get(queueId) || {};
  store.set(queueId, { ...current, ...metadata });
};

/**
 * Fetch patient's medical history from Supabase.
 * Falls back to empty defaults if no record exists yet.
 */
const getPatientHistory = async (patientId) => {
  try {
    const { data: record } = await supabaseAdmin
      .from("patient_medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();

    const { data: prescriptions } = await supabaseAdmin
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("prescribed_at", { ascending: false });

    if (record) {
      return {
        medicalConditions: record.medical_conditions || [],
        prescriptions: (prescriptions || []).map(p => ({
          name: p.medicine_name,
          dosage: p.dosage,
        })),
        completedVisits: record.completed_visits || 0,
      };
    }

    return { medicalConditions: [], prescriptions: [], completedVisits: 0 };
  } catch (err) {
    console.error("getPatientHistory error:", err.message);
    return { medicalConditions: [], prescriptions: [], completedVisits: 0 };
  }
};

/**
 * Persist patient's medical history to Supabase.
 * Upserts medical record and inserts new prescriptions.
 */
const updatePatientHistory = async (patientId, history) => {
  try {
    const { error: recordErr } = await supabaseAdmin
      .from("patient_medical_records")
      .upsert(
        {
          patient_id: patientId,
          medical_conditions: history.medicalConditions || [],
          completed_visits: history.completedVisits || 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "patient_id" }
      );
    if (recordErr) console.error("Upsert medical record error:", recordErr.message);

    if (history.prescriptions && history.prescriptions.length > 0) {
      await supabaseAdmin
        .from("prescriptions")
        .update({ is_active: false })
        .eq("patient_id", patientId);

      const rows = history.prescriptions.map((p) => ({
        patient_id: patientId,
        doctor_id: history.doctorId || null,
        medicine_name: p.name,
        dosage: p.dosage,
        is_active: true,
      }));

      const { error: rxErr } = await supabaseAdmin
        .from("prescriptions")
        .insert(rows);
      if (rxErr) console.error("Insert prescriptions error:", rxErr.message);
    }
  } catch (err) {
    console.error("updatePatientHistory error:", err.message);
  }
};

/**
 * Get combined queue metadata + patient history.
 * NOTE: This is now async!
 */
const getMetadata = async (queueId, patientId) => {
  const meta = store.get(queueId) || {
    travel_mode: null,
    eta_minutes: null,
    eta_timestamp: null,
    arrived_at: null,
    no_show_warning_sent: false,
  };
  const history = await getPatientHistory(patientId);
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
