import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../services/doctorService";
import { bookAppointment } from "../services/appointmentService";
import { toast } from "sonner";
import { motion } from "framer-motion";

function BookAppointment() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [symptomsText, setSymptomsText] = useState("");
  const [triageResult, setTriageResult] = useState("");

  const [formData, setFormData] = useState({
    doctor: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    reason: "",
  });

  const handleTriage = () => {
    const text = symptomsText.toLowerCase().trim();
    if (!text) {
      toast.warning("Please type your symptoms first.");
      return;
    }

    let recommendedSpecialty;
    let reasoning;

    if (text.includes("chest") || text.includes("heart") || text.includes("breathless") || text.includes("bp") || text.includes("palpitation")) {
      recommendedSpecialty = "Cardiologist";
      reasoning = "Your symptoms indicate potential cardiovascular stress. We recommend scheduling an evaluation with our Cardiology department.";
    } else if (text.includes("skin") || text.includes("rash") || text.includes("itch") || text.includes("acne") || text.includes("spots") || text.includes("allergy")) {
      recommendedSpecialty = "Dermatologist";
      reasoning = "Skin irritation, rashes, or chronic itching point to dermatological conditions. We recommend checking in with our Dermatology team.";
    } else if (text.includes("child") || text.includes("baby") || text.includes("kid") || text.includes("pediatric") || text.includes("infant")) {
      recommendedSpecialty = "Pediatrician";
      reasoning = "For child-related illnesses, developmental queries, or pediatric care, our Pediatrics clinic is best suited.";
    } else {
      recommendedSpecialty = "General Physician";
      reasoning = "For general discomfort, mild fever, body aches, or general triage checkups, our General Practitioner team is recommended.";
    }

    const matchedDoctor = doctors.find(doc => 
      doc.specialization?.toLowerCase().includes(recommendedSpecialty.toLowerCase())
    );

    if (matchedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctor: matchedDoctor.id
      }));
      setTriageResult(`✅ Recommendation: Dr. ${matchedDoctor.full_name} (${matchedDoctor.specialization})\n\n💡 Reason: ${reasoning}`);
      toast.success(`Auto-selected Dr. ${matchedDoctor.full_name} for you!`);
    } else {
      setTriageResult(`⚠️ Recommended Specialty: ${recommendedSpecialty}, but no doctors are available in this area today. Reverting to General Physician.`);
      const gpDoctor = doctors.find(doc => doc.specialization?.toLowerCase().includes("general"));
      if (gpDoctor) {
        setFormData(prev => ({ ...prev, doctor: gpDoctor.id }));
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadDoctors = async () => {
      try {
        const data = await getDoctors();
        if (isMounted) {
          // Filter: only display doctors who are currently available today
          setDoctors(data.filter(doc => doc.available));
        }
      } catch (err) {
        console.error("Error loading doctors:", err);
      }
    };
    loadDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBook = async () => {
    if (!formData.doctor || !formData.time) {
      toast.warning("Please select a Doctor and Time.");
      return;
    }

    try {
      const appointmentData = {
        doctor_id: formData.doctor,
        appointment_date: formData.date,
        appointment_time: formData.time,
        status: "Booked",
        notes: formData.reason,
      };

      const result = await bookAppointment(appointmentData);

      console.log("Booking result:", result);

      if (result.success && result.appointment) {
        toast.success("Appointment Created! Proceeding to secure checkout payment to activate your token.");
        
        setFormData({
          doctor: "",
          date: new Date().toISOString().split("T")[0],
          time: "",
          reason: "",
        });

        navigate(`/payment/${result.appointment.id}`);
      } else {
        toast.success("Appointment Booked Successfully!");
        navigate("/patient-dashboard");
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to Book Appointment. Please select a valid open slot.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-10">

        <h1 className="text-4xl font-bold text-blue-600 mb-2">
          📅 Book Appointment
        </h1>

        <p className="text-gray-500 mb-8">
          Fill in your details to schedule an appointment.
        </p>

        <div className="space-y-6">

          {/* AI Symptom Triage Tool */}
          <div className="bg-gradient-to-tr from-blue-50/50 via-white to-cyan-50 border border-blue-100 rounded-3xl p-6 text-left relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl -z-10"></div>
            <h4 className="text-sm font-black text-blue-600 flex items-center gap-1.5 uppercase tracking-wider mb-2">
              🤖 AI Triage & Doctor Recommendation
            </h4>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-4">
              Describe your symptoms below (e.g. *"chest pain"*, *"skin rashes"*, or *"kid fever"*). Our medical diagnostic engine will match and auto-select the best available doctor.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Type symptoms here..."
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleTriage}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3.5 rounded-xl text-xs transition shadow-md shadow-blue-500/10 flex-shrink-0 flex items-center justify-center"
              >
                Analyze Symptoms
              </button>
            </div>
            {triageResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-700 whitespace-pre-line"
              >
                {triageResult}
              </motion.div>
            )}
          </div>

          <div>
            <label className="font-semibold">
              Select Doctor
            </label>

            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              className="w-full mt-2 border rounded-xl p-3"
            >
              <option value="">Select Doctor</option>

              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} • {doctor.specialization} • ₹{doctor.consultation_fee}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700">
              Appointment Date
            </label>
            <div className="w-full mt-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl p-3 font-bold text-sm flex items-center justify-between">
              <span>Today (Immediate Walk-In Queue)</span>
              <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-black">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold">
              Appointment Time
            </label>

            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full mt-2 border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="font-semibold">
              Reason for Visit
            </label>

            <textarea
              name="reason"
              rows="4"
              placeholder="Describe your symptoms..."
              value={formData.reason}
              onChange={handleChange}
              className="w-full mt-2 border rounded-xl p-3"
            />
          </div>

          <button
            onClick={handleBook}
            className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg hover:bg-blue-700 transition"
          >
            Book Appointment
          </button>

        </div>

      </div>
    </div>
  );
}

export default BookAppointment;