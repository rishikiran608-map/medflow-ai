# 🩺 MedFlow AI — Smart AI-Clinic Queue & Patient Flow Management

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-teal?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-blue?style=for-the-badge)](https://razorpay.com/)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-red?style=for-the-badge&logo=twilio)](https://twilio.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple?style=for-the-badge&logo=openai)](https://openai.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend-darkviolet?style=for-the-badge)](https://render.com/)

MedFlow AI is a smart, end-to-end, AI-powered healthcare platform designed to automate patient flow, eliminate clinic wait-time friction, predict no-shows using AI commute analysis, facilitate payments, and provide patients and doctors with real-time queue synchronization.

🌐 **Live Website:** [medflow-ai-eight.vercel.app](https://medflow-ai-eight.vercel.app/)  
⚡ **API Endpoint:** [medflow-ai.onrender.com/api](https://medflow-ai.onrender.com/api)

---

## 👥 User Roles

MedFlow AI offers tailored dashboards and capabilities for three primary user roles:
*   **Patient:** Triage symptoms, book appointments, make payments, track commute/ETA, check-in via QR, and query prescriptions using the AI health assistant.
*   **Doctor:** Monitor real-time queue, call the next patient, view health history, write digital prescriptions, and complete consultations.
*   **Hospital Admin:** Monitor live queue performance, onboard/offboard doctors, view analytics, register walk-in patients, and seed demo data.

---

## ✨ Core Features (25+)

| Feature | Category | Description |
| :--- | :--- | :--- |
| **Multi-Role Authentication** | Core | Email/password sign-in and sign-up with auto-generated profiles for Patients, Doctors, and Admins. |
| **Quick-Fill Demo Access** | Core | Instant one-click quick-fill credentials on the Login screen for seamless demo presentation. |
| **AI Symptom Triage** | AI/ML | Intelligent, keyword-based symptom parser recommends matching specialists (Cardiology, Dermatology, etc.). |
| **Appointment Booking** | Core | Select doctor, date, and time slot with real-time slot conflict check. |
| **Razorpay Payment Gateway** | Finance | Complete booking payment with secure checkout and server-side HMAC signature verification. |
| **Fast Checkout Bypass** | Demo | "Instant Demo Bypass" button to easily simulate successful transactions without external gateways. |
| **Dynamic Queue Statuses** | Queue | Token system tracking: `Pending Payment` → `Waiting` → `On The Way` → `Arriving` → `Checked In` → `In Consultation` → `Completed` / `No Show`. |
| **AI Wait Time Predictor** | AI/ML | Predicts wait times based on queue size, consult reasons (emergency vs checkup), and doctor speed. |
| **Commute & Travel Mode Tracker** | Map/Location | "I'm On The Way" tracking supporting Walking, Bicycling, Transit, and Driving. |
| **Live Traffic ETA Simulator** | Location | Simulates peak-hour traffic multipliers and delay updates based on actual time-of-day commute modes. |
| **No-Show AI Risk Classifier** | AI/ML | Predicts patient no-show probability based on age, transport mode, commute distance, and eta delay. |
| **Background No-Show Daemon** | Automation | Node daemon checking queue statuses every 25s, marking expired sessions as `No Show`, and auto-adjusting subsequent wait times. |
| **30-Min Reminder Daemon** | Automation | Automatically scans upcoming appointments and sends reminders to patients 30 minutes before booking starts. |
| **Twilio WhatsApp Integration** | Messaging | Real-time Twilio WhatsApp alerts for payment confirmation, queue delays, and check-in tickets. |
| **SMS/WhatsApp Fallback Mode**| Messaging | Graceful console-logger fallback if Twilio credentials are missing in the environment. |
| **AI Chatbot (GPT-4o-mini)** | Assistant | Interactive conversational chatbot for scheduling, slot lookups, and diagnosis descriptions. |
| **Local NLP Chat Engine** | Assistant | Instant regex-based local fallback engine that answers health questions if OpenAI keys are missing. |
| **Webcam QR Check-In** | Scanner | Admin Dashboard uses the webcam device stream to scan and verify QR codes on patient tickets. |
| **Digital Patient QR Token** | Scanner | Dynamic, scannable QR code generated for every active token using patient's unique booking ID. |
| **Digital Prescription Pad** | Clinical | Doctors can write diagnoses and list medications with active/inactive status and custom dosages. |
| **Electronic Health Records** | Clinical | Patient history (past diagnoses, active prescriptions) persisted securely to Supabase. |
| **Walk-in Registration** | Admin | Admin can register and instantly check in walk-in patients from the reception dashboard. |
| **Doctor Onboarding** | Admin | Recruit and register new doctors with custom consultation fees and schedules. |
| **Interactive Analytics** | Admin | Live charts illustrating wait times, no-show rates, patient throughput, and active doctor load. |
| **Framer Motion Animations** | Design | Sleek animations, sliding drawers, visual state indicators, and premium modern glassmorphic styling. |

---

## 📁 Project Structure

```
medflow-ai/
├── client/                     # React Frontend (Vite)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── api/                # Axios configuration & JWT Interceptor
│   │   ├── components/         # Shared UI parts (Navbar, Hero, ChatWidget, ProtectedRoute)
│   │   ├── pages/              # 7 Main Application pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BookAppointment.jsx
│   │   │   └── PaymentPage.jsx
│   │   ├── services/           # Abstraction layer communicating with APIs
│   │   └── App.jsx             # React Routes config with role-based ProtectedRoute
│   ├── index.html              # HTML shell hosting libraries (html5-qrcode, Razorpay)
│   └── package.json
└── server/                     # Express Backend (CommonJS)
    ├── config/                 # Supabase DB Admin initialization
    ├── controllers/            # Request handlers (auth, payments, queue, chat, doctors)
    ├── middleware/             # Role extraction, authorization, global error handler
    ├── routes/                 # Express REST Routers (28 API Endpoints)
    ├── services/               # Core business logic, predictions, daemons, Twilio WhatsApp
    ├── tests/                  # Vitest unit test suite
    ├── server.js               # Entry point, daemon initializations
    └── package.json
```

---

## 🔌 API Endpoints Summary (28)

### Auth (`/api/auth`)
*   `POST /register` — Register a new patient
*   `POST /login` — Log in (patient/doctor/admin) and retrieve token
*   `POST /verify-password` — (Rate-limited) Verify password for medical history access

### Patients (`/api/patients`)
*   `GET /` — Fetch patients list
*   `POST /` — Add patient
*   `PUT /:id` — Edit patient
*   `DELETE /:id` — Delete patient record

### Doctors (`/api/doctors`)
*   `GET /` — Get active doctors
*   `POST /` — Onboard new doctor (Admin)
*   `DELETE /:id` — Offboard doctor (Admin)

### Appointments (`/api/appointments`)
*   `GET /` — Get user appointments
*   `POST /` — Book new appointment slot
*   `PUT /pay/:id` — Update payment status

### Payments (`/api/payments`)
*   `POST /create-order` — Create Razorpay order
*   `POST /verify` — Verify signature and activate queue token

### Queue (`/api/queue`)
*   `GET /` — Fetch active queue status (Public)
*   `GET /active` — Active queue token for patient
*   `GET /doctor` — Doctor-specific active queue entries
*   `GET /predict/:doctorId` — AI Queue wait simulation
*   `POST /` — Add booking to queue
*   `POST /walk-in` — Register and check in a walk-in patient (Admin)
*   `POST /seed-demo` — (Protected) Seed initial demo databases
*   `PUT /on-the-way` — Update commute transport mode & eta
*   `PUT /check-in` — Verify patient ticket (Kiosk QR/Manual)
*   `PUT /call-next` — Recall next waiting patient to doctor chamber
*   `PUT /complete/:id` — Complete consultation & submit prescription
*   `PUT /cancel/:id` — Cancel ticket & trigger queue backfill

### Chat (`/api/chat`)
*   `POST /` — Chat with assistant (GPT-4o-mini / local NLP engine fallback)

---

## 🗄️ Database Schema (Supabase PostgreSQL)

The database consists of these tables:
1.  **`users`**: Master credential mapping containing email, role, and metadata.
2.  **`patients`**: Patient clinical profile details, contact numbers.
3.  **`doctors`**: Doctor specifications, experience, specialty, fee, availability.
4.  **`appointments`**: Booked slot dates, times, and status.
5.  **`queue`**: Clinic queue tokens, estimated wait time tracking, commute metrics, checkout statuses.
6.  **`patient_medical_records`**: Electronic health records, diagnosed conditions summary.
7.  **`prescriptions`**: Active prescribed items with medication names and dosage instruction schedules.

---

## ⚙️ Environment Variables Setup

### Server Configuration (`server/.env`)
Create a `.env` file under the `/server` directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Twilio Keys
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### Client Configuration (`client/.env`)
Create a `.env` file under the `/client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Running Local Development

### 1. Backend Server Setup
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Client Setup
```bash
cd ../client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Click the quick-fill buttons to test Patient, Doctor, or Hospital Admin views instantly!

---

## 🧪 Testing

The server includes a unit test suite using **Vitest** covering travel ETA traffic delays, no-show classifiers, and WhatsApp notification payload dispatches.

To execute tests:
```bash
cd server
npm test
```

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE details.
