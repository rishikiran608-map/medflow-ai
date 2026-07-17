/**
 * MedFlow AI — Demo Data Layer
 * Provides realistic, presentation-ready fake data for every dashboard.
 * All data is seeded in-memory and never touches the real database.
 * Import DEMO_* constants wherever you want to show rich sample content.
 */

export const TODAY = new Date().toISOString().split("T")[0];
export const FMT_DATE = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

// ─── Doctors ─────────────────────────────────────────────────────────────────
export const DEMO_DOCTORS = [
  { id: "doc-1", full_name: "Dr. Rajesh Kumar",   specialization: "Cardiology",      qualification: "MD, DM",         consultation_fee: 250, available: true,  experience: 14 },
  { id: "doc-2", full_name: "Dr. Sarah Patel",    specialization: "Pediatrics",      qualification: "MD, DCH",        consultation_fee: 220, available: true,  experience: 9  },
  { id: "doc-3", full_name: "Dr. Amit Sharma",    specialization: "Orthopedics",     qualification: "MS, MCh",        consultation_fee: 280, available: true,  experience: 11 },
  { id: "doc-4", full_name: "Dr. Emily Watson",   specialization: "Dermatology",     qualification: "MD, DVD",        consultation_fee: 240, available: true,  experience: 7  },
  { id: "doc-5", full_name: "Dr. Vikram Iyer",    specialization: "General Medicine",qualification: "MD, FCGP",       consultation_fee: 200, available: true,  experience: 18 },
  { id: "doc-6", full_name: "Dr. Sophia Chen",    specialization: "Neurology",       qualification: "MD, DM (Neuro)", consultation_fee: 300, available: false, experience: 16 },
  { id: "doc-7", full_name: "Dr. Priya Nair",     specialization: "Gynecology",      qualification: "MD, DGO",        consultation_fee: 260, available: true,  experience: 12 },
];

// ─── Patients ─────────────────────────────────────────────────────────────────
export const DEMO_PATIENTS = [
  { id: "pat-1",  full_name: "Aarav Mehta",    age: 34, gender: "Male",   phone: "98765-43210", email: "aarav@example.com",   conditions: ["Hypertension", "Coronary Artery Disease"] },
  { id: "pat-2",  full_name: "Priya Sharma",   age: 28, gender: "Female", phone: "98765-43211", email: "priya@example.com",   conditions: ["Arrhythmia"] },
  { id: "pat-3",  full_name: "Rohan Das",      age: 45, gender: "Male",   phone: "98765-43212", email: "rohan@example.com",   conditions: ["Type-2 Diabetes", "Mild Hyperlipidemia"] },
  { id: "pat-4",  full_name: "Ananya Iyer",    age: 22, gender: "Female", phone: "98765-43213", email: "ananya@example.com",  conditions: ["Mitral Valve Prolapse"] },
  { id: "pat-5",  full_name: "Vikram Singh",   age: 52, gender: "Male",   phone: "98765-43214", email: "vikram@example.com",  conditions: ["Post-MI Recovery", "Angina"] },
  { id: "pat-6",  full_name: "Sneha Reddy",    age: 29, gender: "Female", phone: "98765-43215", email: "sneha@example.com",   conditions: ["Allergic Asthma"] },
  { id: "pat-7",  full_name: "Arjun Gupta",    age: 31, gender: "Male",   phone: "98765-43216", email: "arjun@example.com",   conditions: ["Migraine", "Anxiety"] },
  { id: "pat-8",  full_name: "Kirti Joshi",    age: 26, gender: "Female", phone: "98765-43217", email: "kirti@example.com",   conditions: ["PCOS", "Iron-deficiency Anaemia"] },
  { id: "pat-9",  full_name: "Rishi Kiran",    age: 24, gender: "Male",   phone: "98765-43218", email: "rishi@example.com",   conditions: ["Seasonal Allergies"] },
  { id: "pat-10", full_name: "Devika Sen",     age: 27, gender: "Female", phone: "98765-43220", email: "devika@example.com",  conditions: ["Hypothyroidism"] },
];

// ─── Live Queue (Doctor Dashboard view) ───────────────────────────────────────
export const DEMO_QUEUE = [
  {
    id: "q-1", token_number: 1, queue_status: "In Consultation", estimated_wait: 0,
    patients: { full_name: "Aarav Mehta",  age: 34, gender: "Male"   },
    doctors:  { full_name: "Dr. Rajesh Kumar" },
    notes: JSON.stringify({
      symptomText: "Chest tightness and shortness of breath for 3 days, worse on exertion.",
      aiSummary: {
        primaryComplaint: "Exertional chest tightness with dyspnea lasting 3 days.",
        visibleFindings:  "Patient appears mildly distressed. No visible cyanosis.",
        symptomsMentioned: ["Chest tightness", "Shortness of breath", "Exertional dyspnea", "Fatigue"],
        duration: "3 days",
        severity: "Moderate",
        suggestedDepartment: "Cardiology",
        urgencyLevel: "Urgent Care",
        additionalNotes: "ECG and troponin levels recommended. Rule out ACS. Patient has known hypertension.",
        confidenceScore: 91,
      }
    })
  },
  {
    id: "q-2", token_number: 2, queue_status: "Checked In",     estimated_wait: 12,
    patients: { full_name: "Priya Sharma",  age: 28, gender: "Female" },
    doctors:  { full_name: "Dr. Rajesh Kumar" },
    notes: JSON.stringify({ symptomText: "Palpitations and occasional dizziness.", aiSummary: null })
  },
  {
    id: "q-3", token_number: 3, queue_status: "On The Way",     estimated_wait: 25,
    patients: { full_name: "Rohan Das",     age: 45, gender: "Male"   },
    doctors:  { full_name: "Dr. Rajesh Kumar" },
    notes: "{}"
  },
  {
    id: "q-4", token_number: 4, queue_status: "Waiting",        estimated_wait: 38,
    patients: { full_name: "Vikram Singh",  age: 52, gender: "Male"   },
    doctors:  { full_name: "Dr. Rajesh Kumar" },
    notes: "{}"
  },
  {
    id: "q-5", token_number: 5, queue_status: "Waiting",        estimated_wait: 50,
    patients: { full_name: "Devika Sen",    age: 27, gender: "Female" },
    doctors:  { full_name: "Dr. Rajesh Kumar" },
    notes: "{}"
  },
];

// ─── Appointments (Patient Dashboard view) ────────────────────────────────────
export const DEMO_APPOINTMENTS = [
  {
    id: "apt-1", appointment_date: TODAY, appointment_time: "10:30",
    status: "Booked", doctor_id: "doc-1",
    doctors: { full_name: "Dr. Rajesh Kumar", specialization: "Cardiology", consultation_fee: 250 },
    notes: JSON.stringify({ symptomText: "Chest tightness on exertion.", aiSummary: { suggestedDepartment: "Cardiology", severity: "Moderate", urgencyLevel: "Urgent Care" } })
  },
  {
    id: "apt-2", appointment_date: FMT_DATE(2), appointment_time: "14:00",
    status: "Booked", doctor_id: "doc-4",
    doctors: { full_name: "Dr. Emily Watson", specialization: "Dermatology", consultation_fee: 240 },
    notes: "{}"
  },
  {
    id: "apt-3", appointment_date: FMT_DATE(-5), appointment_time: "11:00",
    status: "Completed", doctor_id: "doc-5",
    doctors: { full_name: "Dr. Vikram Iyer", specialization: "General Medicine", consultation_fee: 200 },
    notes: "{}"
  },
  {
    id: "apt-4", appointment_date: FMT_DATE(-12), appointment_time: "09:30",
    status: "Completed", doctor_id: "doc-1",
    doctors: { full_name: "Dr. Rajesh Kumar", specialization: "Cardiology", consultation_fee: 250 },
    notes: "{}"
  },
];

// ─── Prescriptions (Pharmacist + Patient view) ────────────────────────────────
export const DEMO_PRESCRIPTIONS = [
  {
    id: "rx-1",
    hospital: "MedFlow Prime Clinic",
    doctor: "Dr. Rajesh Kumar",
    diagnosis: "Essential Hypertension + Coronary Artery Disease",
    date: FMT_DATE(-5),
    medicines: [
      { name: "Amlodipine",   dosage: "5mg",  frequency: "Once Daily (Morning)",     duration: "30 days" },
      { name: "Aspirin",      dosage: "75mg", frequency: "Once Daily (Post-meal)",    duration: "30 days" },
      { name: "Atorvastatin", dosage: "10mg", frequency: "Once Daily (Night)",        duration: "30 days" },
    ],
    confidenceScore: 0.96,
    warnings: "Avoid grapefruit juice with Amlodipine. Aspirin with food only.",
    status: "Dispensed"
  },
  {
    id: "rx-2",
    hospital: "MedFlow Prime Clinic",
    doctor: "Dr. Emily Watson",
    diagnosis: "Atopic Dermatitis",
    date: FMT_DATE(-2),
    medicines: [
      { name: "Cetirizine",       dosage: "10mg", frequency: "Once Daily (Night)",   duration: "14 days" },
      { name: "Hydrocortisone",   dosage: "1%",   frequency: "Apply twice daily",     duration: "7 days"  },
      { name: "Moisturizing Cream", dosage: "30g", frequency: "Apply after bath",    duration: "Ongoing"  },
    ],
    confidenceScore: 0.89,
    warnings: "Avoid prolonged steroid cream use on face.",
    status: "Pending"
  },
];

// ─── Medical Timeline ─────────────────────────────────────────────────────────
export const DEMO_TIMELINE = [
  { type: "Consultation", date: FMT_DATE(-2),  desc: "Cardiology review with Dr. Rajesh Kumar. BP: 138/86. ECG: Normal sinus rhythm. LDL elevated — statin adjusted.", icon: "🩺" },
  { type: "Lab Report",   date: FMT_DATE(-7),  desc: "Lipid Panel: Total Cholesterol 214 mg/dL, LDL 128 mg/dL (High), HDL 48 mg/dL. HbA1c: 6.2% (Pre-diabetic range).", icon: "📊" },
  { type: "Medication",   date: FMT_DATE(-7),  desc: "Started Atorvastatin 10mg at night. Aspirin 75mg post-meal. Continue Amlodipine 5mg morning.", icon: "💊" },
  { type: "Consultation", date: FMT_DATE(-35), desc: "Routine checkup with Dr. Vikram Iyer. Vitals: BP 142/90, HR 78 bpm. Advised lifestyle modification.", icon: "🩺" },
  { type: "Vaccination",  date: FMT_DATE(-90), desc: "COVID-19 Booster administered. Influenza vaccine (2026 strain). No adverse reactions.", icon: "💉" },
  { type: "Surgery",      date: "2025-11-20",  desc: "Laparoscopic Appendectomy at City Medical Centre. Procedure successful. Discharged after 48 hrs.", icon: "🏥" },
  { type: "Lab Report",   date: "2025-10-14",  desc: "Complete Blood Count: Hb 13.2 g/dL, WBC 7,200/μL, Platelets 1.8L — All within normal range.", icon: "📊" },
];

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export const DEMO_ADMIN_STATS = {
  totalPatients: 1842,
  totalDoctors: 7,
  activeQueue: 5,
  averageWait: 23,
  completedToday: 34,
  revenueToday: "₹42,500",
  aiQueries: 187,
  satisfaction: "96.4%",
};

// ─── Pharmacist Pending Prescriptions ────────────────────────────────────────
export const DEMO_PHARMA_PENDING = [
  { id: "px-1", patient: "Aarav Mehta",    doctor: "Dr. Rajesh Kumar", meds: 3, urgency: "High",   time: "10:42 AM", status: "Pending" },
  { id: "px-2", patient: "Sneha Reddy",    doctor: "Dr. Vikram Iyer",  meds: 2, urgency: "Normal", time: "11:05 AM", status: "Pending" },
  { id: "px-3", patient: "Priya Sharma",   doctor: "Dr. Rajesh Kumar", meds: 1, urgency: "Normal", time: "11:30 AM", status: "Ready"   },
  { id: "px-4", patient: "Kirti Joshi",    doctor: "Dr. Priya Nair",   meds: 4, urgency: "Normal", time: "12:10 PM", status: "Pending" },
  { id: "px-5", patient: "Arjun Gupta",    doctor: "Dr. Sophia Chen",  meds: 2, urgency: "Low",    time: "12:45 PM", status: "Dispensed" },
];

// ─── Clinic Owner KPIs ───────────────────────────────────────────────────────
export const DEMO_CLINIC_KPIS = {
  revenue:         "₹3,24,500",
  revenueChange:   "+18.4%",
  retention:       "91.2%",
  retentionChange: "+3.1%",
  utilization:     "82%",
  utilizationChange: "+5.4%",
  aiAdoption:      "94.8%",
  aiAdoptionChange: "+12.0%",
  patientsThisMonth: 1842,
  nps: 72,
};

// ─── AI Notifications ────────────────────────────────────────────────────────
export const DEMO_NOTIFICATIONS = [
  { id: 1, type: "WhatsApp", time: "Just Now",    recipient: "Aarav Mehta",  message: "⚠️ Your appointment with Dr. Rajesh Kumar begins in 8 minutes. Token #1 is active. Walk-in lobby is ready.", status: "Delivered" },
  { id: 2, type: "SMS",      time: "3 mins ago",  recipient: "Priya Sharma", message: "✅ Slot Backfilled! Token moved up — new wait: 12 mins. Dr. Kumar is ready.", status: "Delivered" },
  { id: 3, type: "WhatsApp", time: "12 mins ago", recipient: "Rohan Das",    message: "🚗 Commute Alert: Heavy traffic on NH-48. Please start 15 mins early to preserve Token #3.", status: "Delivered" },
  { id: 4, type: "WhatsApp", time: "28 mins ago", recipient: "Vikram Singh", message: "🎫 QR Verified: Welcome! Token #4 — estimated wait 38 mins. Lounge is air-conditioned.", status: "Sent" },
  { id: 5, type: "Email",    time: "1 hr ago",    recipient: "Sneha Reddy",  message: "📋 Post-Visit Summary: Your prescription from Dr. Watson is ready at pharmacy counter. Invoice attached.", status: "Delivered" },
];

// ─── Active Queue Entry (Patient's own entry) ────────────────────────────────
export const DEMO_QUEUE_ENTRY = {
  id: "q-me",
  token_number: 3,
  queue_status: "On The Way",
  estimated_wait: 25,
  travel_mode: "Driving",
  distance_km: 4.2,
  eta_minutes: 18,
  doctor_name: "Dr. Rajesh Kumar",
  specialization: "Cardiology",
  created_at: new Date(Date.now() - 40 * 60000).toISOString(),
};
