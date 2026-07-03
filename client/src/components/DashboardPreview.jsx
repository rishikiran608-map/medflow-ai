import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { getQueue } from "../services/queueService";

function DashboardPreview() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const patientsData = await getPatients();
        const doctorsData = await getDoctors();
        const queueData = await getQueue();

        if (isMounted) {
          setPatients(patientsData);
          setDoctors(doctorsData);
          setQueue(queueData);
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const averageWait =
    queue.length > 0
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + (item.estimated_wait || 0),
            0
          ) / queue.length
        )
      : 0;

  return (
    <section id="dashboard" className="py-20 bg-gray-100">
      <div className="max-w-6xl mx-auto px-6">

        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Hospital Dashboard
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >

          {/* Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">

            <div className="bg-blue-100 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-blue-600">
                {patients.length}
              </h3>
              <p>Total Patients</p>
            </div>

            <div className="bg-yellow-100 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-yellow-600">
                {queue.length}
              </h3>
              <p>Waiting</p>
            </div>

            <div className="bg-green-100 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-green-600">
                {doctors.length}
              </h3>
              <p>Doctors</p>
            </div>

            <div className="bg-purple-100 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-purple-600">
                {averageWait} min
              </h3>
              <p>Average Wait</p>
            </div>

          </div>

          {/* Live Queue */}
          <div className="space-y-4">

            {queue.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No patients in queue
              </div>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between bg-gray-50 p-4 rounded-xl hover:bg-blue-50 transition"
                >
                  <span className="font-semibold">
                    🟢 Token #{item.token_number}
                  </span>

                  <span className="text-blue-600 font-semibold">
                    {item.estimated_wait} min
                  </span>
                </div>
              ))
            )}

          </div>

        </motion.div>
      </div>
    </section>
  );
}

export default DashboardPreview;