const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const OpenAI = require("openai");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Pre-defined knowledge items for our Clinic OS Agentic RAG
const RAG_SEED_DOCUMENTS = [
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

const seedRAG = async () => {
  console.log("Starting RAG Knowledge Database seeding...");
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  let openai = null;
  if (hasOpenAI) {
    console.log("OpenAI API key found, generating high-quality text embeddings.");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    console.warn("⚠️ OpenAI API key missing. Generating mock zero-embeddings for semantic search compatibility.");
  }

  // Check if table exists
  const { data: testData, error: testErr } = await supabase
    .from("knowledge_documents")
    .select("id")
    .limit(1);

  if (testErr) {
    console.error("❌ Error checking knowledge_documents table. Did you execute migrations.sql in Supabase SQL Editor?", testErr.message);
    console.log("\n👉 Please run the SQL statements in the 'migrations.sql' file using your Supabase dashboard first!");
    process.exit(1);
  }

  // Clear existing seeded docs to avoid duplicates
  console.log("Cleaning old seed entries...");
  await supabase.from("knowledge_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const doc of RAG_SEED_DOCUMENTS) {
    console.log(`Processing: "${doc.title}"`);
    let embedding = Array(1536).fill(0.0);

    if (hasOpenAI) {
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: `${doc.title}\n\n${doc.content}`,
        });
        embedding = response.data[0].embedding;
      } catch (err) {
        console.error(`Failed to generate embedding for "${doc.title}":`, err.message);
      }
    }

    const { error: insertErr } = await supabase.from("knowledge_documents").insert([
      {
        title: doc.title,
        content: doc.content,
        category: doc.category,
        role_access: doc.role_access,
        embedding,
        metadata: { source: "clinic_seed_v1", characters: doc.content.length }
      }
    ]);

    if (insertErr) {
      console.error(`❌ Failed to insert "${doc.title}":`, insertErr.message);
    } else {
      console.log(`✅ Seeded: "${doc.title}"`);
    }
  }

  console.log("\n🎉 Database Seeding and Setup Complete!");
};

seedRAG().catch((err) => {
  console.error("Database setup script crashed:", err);
  process.exit(1);
});
