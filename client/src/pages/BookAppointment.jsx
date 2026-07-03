import { useState, useEffect } from "react";
import { getDoctors } from "../services/doctorService";
import { bookAppointment } from "../services/appointmentService";

function BookAppointment() {
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  useEffect(() => {
    let isMounted = true;
    const loadDoctors = async () => {
      try {
        const data = await getDoctors();
        if (isMounted) {
          setDoctors(data);
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
    if (!formData.doctor || !formData.date || !formData.time) {
      alert("⚠️ Please select Doctor, Date, and Time.");
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

      if (result.success && result.queue) {
        alert(
          `✅ Appointment Booked Successfully!\n\n` +
          `🟢 Your Queue Token: #${result.queue.token_number}\n` +
          `⏱️ Estimated Wait Time: ${result.estimated_wait} mins`
        );
      } else {
        alert("✅ Appointment Booked Successfully!");
      }

      setFormData({
        doctor: "",
        date: "",
        time: "",
        reason: "",
      });

    } catch (error) {
      console.error(error);
      alert("❌ Failed to Book Appointment");
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
            <label className="font-semibold">
              Appointment Date
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full mt-2 border rounded-xl p-3"
            />
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