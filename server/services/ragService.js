const { supabaseAdmin } = require("../config/supabase");
const OpenAI = require("openai");

// Generate embedding for text (uses OpenAI's text-embedding-3-small, fallbacks to zero-vectors)
const generateEmbedding = async (text) => {
  if (!text) return null;
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      return response.data[0].embedding;
    } catch (err) {
      console.error("Error generating OpenAI embedding, using fallback:", err.message);
    }
  }
  
  // 1536-dimension float array for pgvector compatibility
  return Array(1536).fill(0.0);
};

// Vector similarity search inside Supabase database via the custom RPC match_documents
const vectorSearch = async ({ embedding, role, category = null, limit = 5 }) => {
  try {
    const { data, error } = await supabaseAdmin.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.1, // low threshold for testing
      match_count: limit,
      filter_category: category,
      filter_role_access: role
    });

    if (error) {
      console.error("RPC match_documents error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("vectorSearch exception:", err.message);
    return [];
  }
};

// Fetch real-time patient clinical records directly from SQL tables
const getPatientLiveContext = async (patientId) => {
  if (!patientId) return null;
  
  try {
    // 1. Vitals & Medical record summary
    const { data: record } = await supabaseAdmin
      .from("patient_medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .maybeSingle();

    // 2. Active prescriptions
    const { data: prescriptions } = await supabaseAdmin
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("prescribed_at", { ascending: false });

    // 3. Appointments
    const { data: appointments } = await supabaseAdmin
      .from("appointments")
      .select("*, doctors(full_name)")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false })
      .limit(3);

    // 4. Live Queue Status
    const { data: queue } = await supabaseAdmin
      .from("queue")
      .select("*, doctors(full_name)")
      .eq("patient_id", patientId)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      record: record || { medical_conditions: [], completed_visits: 0 },
      prescriptions: prescriptions || [],
      appointments: appointments || [],
      queue: queue || null
    };
  } catch (err) {
    console.error("Failed to retrieve live patient context:", err.message);
    return null;
  }
};

const FALLBACK_KNOWLEDGE_BASE = [
  {
    title: "MedFlow Clinic SOP - Appointment Cancellation & Late Policies",
    content: "MedFlow Clinic allows patients to cancel or reschedule appointments up to 1 hour before the scheduled start time. If a patient is late by more than 15 minutes, their token status transitions to 'No Show' automatically via the background daemon. Subsequent appointments in the queue are then backfilled, shifting wait times earlier by up to 15 minutes. Delayed patients must check in at the reception desk to be reassigned to the end of the queue.",
    category: "SOP",
    role_access: ["Patient", "Doctor", "Hospital Admin", "Pharmacist", "Clinic Owner"]
  },
  {
    title: "MedFlow Clinic SOP - Insurance Pre-Verification Workflow",
    content: "Before any diagnostic tests or specialized appointments, the Receptionist must verify the patient's insurance details. Accepted providers include Blue Cross, Aetna, Cigna, and UnitedHealth. If pre-authorization is required, the Receptionist AI Assistant logs a request and marks the patient record with 'Insurance Verified' flag. Consultations can proceed pending payment, but prescriptions and discharge records are withheld until billing clearance.",
    category: "SOP",
    role_access: ["Hospital Admin", "Clinic Owner", "Doctor"]
  },
  {
    title: "Clinical Treatment Guideline - Hypertension Management",
    content: "For patients diagnosed with Hypertension (Stage 1 or 2), the standard clinical protocol recommends initiating therapy with ACE inhibitors, ARBs, or Calcium Channel Blockers (such as Amlodipine 5mg). Daily dosage should be monitored. Check blood pressure twice daily. Inform patients to avoid excessive sodium intake and maintain moderate cardiovascular exercise. If systolic BP remains above 140 mmHg, schedule a follow-up consultation in 2 weeks.",
    category: "Guideline",
    role_access: ["Doctor", "Pharmacist", "Clinic Owner"]
  },
  {
    title: "Clinical Treatment Guideline - Type-2 Diabetes Care Protocol",
    content: "Initial management of Type-2 Diabetes focuses on lifestyle modifications combined with Metformin (500mg or 1000mg daily, post-meals). Monitor HbA1c levels quarterly. The target HbA1c level is under 7.0% for most adults. If the patient presents mild hyperlipidemia, concurrent statin therapy (such as Atorvastatin 10mg at night) is advised. Patients must be screened annually for diabetic retinopathy and nephropathy.",
    category: "Guideline",
    role_access: ["Doctor", "Pharmacist", "Clinic Owner"]
  },
  {
    title: "Drug Database Profile - Metformin 500mg Details & Warnings",
    content: "Metformin is an oral biguanide anti-diabetic drug. Dosage: 500mg or 850mg once or twice daily, taken with or after meals to reduce gastrointestinal side effects. Common side effects include nausea, diarrhea, and abdominal pain. Contraindications: Renal impairment (eGFR < 30 mL/min/1.73m²), acute metabolic acidosis, or severe liver disease. Drug Interactions: Contrast agents (discontinue Metformin 48h before/after contrast scans to avoid lactic acidosis) and duplicate medications containing other biguanide combinations.",
    category: "Medicine",
    role_access: ["Patient", "Doctor", "Pharmacist", "Clinic Owner"]
  },
  {
    title: "Drug Database Profile - Amlodipine 5mg Details & Warnings",
    content: "Amlodipine is a dihydropyridine calcium channel blocker used to treat hypertension and coronary artery disease. Dosage: 5mg once daily, titrating to 10mg if necessary. Common side effects include peripheral edema (swelling of ankles), dizziness, and palpitations. Contraindications: Severe hypotension, cardiogenic shock, and active aortic stenosis. Avoid taking Amlodipine with Grapefruit juice as it increases drug concentration levels.",
    category: "Medicine",
    role_access: ["Patient", "Doctor", "Pharmacist", "Clinic Owner"]
  },
  {
    title: "Drug Database Profile - Aspirin 75mg Details & Warnings",
    content: "Aspirin (Acetylsalicylic Acid) is an antiplatelet agent used for secondary prevention of cardiovascular events. Dosage: 75mg to 150mg daily, post-meal to protect gastric mucosa. Warning: High risk of gastrointestinal bleeding or peptic ulcers. Contraindications: Active bleeding, bleeding disorders, severe renal or hepatic failure, and pediatric patients (risk of Reye's syndrome). Advise patient to monitor for dark stools or easy bruising.",
    category: "Medicine",
    role_access: ["Patient", "Doctor", "Pharmacist", "Clinic Owner"]
  }
];

// Keyword-based search fallback (extremely useful for offline presentation or missing pgvector)
const keywordFallbackSearch = async ({ query, role, category = null, limit = 5 }) => {
  try {
    const cleanQuery = query.replace(/[?.,!:\-\/()]/g, " ");
    const terms = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (terms.length === 0) return [];
    
    let documents = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("knowledge_documents")
        .select("*");
        
      if (!error && data && data.length > 0) {
        documents = data;
      } else {
        documents = FALLBACK_KNOWLEDGE_BASE;
      }
    } catch (dbErr) {
      console.log("Supabase query error, fallback to mock knowledge documents:", dbErr.message);
      documents = FALLBACK_KNOWLEDGE_BASE;
    }
    
    // Score documents by keyword hits in title/content
    const scored = documents.map(doc => {
      let score = 0;
      const titleLower = (doc.title || "").toLowerCase();
      const contentLower = (doc.content || "").toLowerCase();
      
      for (const term of terms) {
        if (titleLower.includes(term)) score += 3;
        if (contentLower.includes(term)) score += 1;
      }
      return { ...doc, score };
    });
    
    // Filter based on hits and access permissions
    const filtered = scored.filter(doc => {
      if (doc.score === 0) return false;
      if (category && doc.category !== category) return false;
      if (role && doc.role_access && !doc.role_access.includes(role)) return false;
      return true;
    });
    
    // Sort and format similarity metric
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(doc => ({
        ...doc,
        similarity: Math.min(0.99, 0.70 + (doc.score * 0.04))
      }));
  } catch (err) {
    console.error("keywordFallbackSearch exception:", err.message);
    return [];
  }
};

// Hybrid search connecting vector chunks and live database parameters
const performHybridSearch = async ({ query, patientId = null, role = "Patient", category = null, limit = 5 }) => {
  // 1. Generate Query Vector
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Fetch semantic matches from pgvector knowledge_documents
  let vectorResults = [];
  const isAllZero = !queryEmbedding || queryEmbedding.every(val => val === 0.0);
  if (queryEmbedding && !isAllZero) {
    vectorResults = await vectorSearch({ embedding: queryEmbedding, role, category, limit });
  }
  
  // If pgvector returned empty results, trigger keyword fallback so RAG is 100% operational
  if (vectorResults.length === 0) {
    console.log("RAG executing keyword fallback search for:", query);
    vectorResults = await keywordFallbackSearch({ query, role, category, limit });
  }

  // 3. Retrieve live patient record context if a patient context is provided
  let patientLiveContext = null;
  if (patientId) {
    patientLiveContext = await getPatientLiveContext(patientId);
  }

  // 4. Compute Confidence Score & compile findings
  let totalScore = 0.85; // baseline confidence
  if (vectorResults.length > 0) {
    // Average similarity score of matching chunks
    const sum = vectorResults.reduce((acc, doc) => acc + (doc.similarity || 0), 0);
    totalScore = sum / vectorResults.length;
  }
  
  // Force score range [0.0 - 1.0]
  const confidenceScore = Math.min(1.0, Math.max(0.2, parseFloat(totalScore.toFixed(2))));

  // 5. Build citations list
  const citations = vectorResults.map(doc => ({
    title: doc.title,
    category: doc.category,
    confidence: doc.similarity ? parseFloat(doc.similarity.toFixed(2)) : 0.8
  }));

  // Add default citations for live database sources if used
  if (patientLiveContext) {
    citations.push({
      title: "Active Patient Profile & EHR (Live Database)",
      category: "Patient Record",
      confidence: 1.0
    });
  }

  return {
    query,
    vectorResults,
    patientLiveContext,
    confidenceScore,
    citations
  };
};

module.exports = {
  generateEmbedding,
  performHybridSearch,
  getPatientLiveContext
};
