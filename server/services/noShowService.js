/**
 * MedFlow AI - Background No-Show Detection Service
 * Scans active queue entries. If a patient is late and fails to check in,
 * it marks them No-Show, auto-recovers the queue, and updates wait times.
 */
const { supabaseAdmin: supabase } = require("../config/supabase");
const { getMetadata, clearMetadata } = require("./queueMetadataStore");
const { sendWhatsAppNotification } = require("./whatsappService");

const startNoShowDetection = (checkIntervalMs = 25000, expirationThresholdMins = 3) => {
  console.log(`⏱️ MedFlow AI: Background No-Show Detector started (Running every ${checkIntervalMs / 1000}s)...`);
  
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Fetch active queue entries that are in 'Waiting' or 'Arriving' status
      const { data: activeEntries, error } = await supabase
        .from("queue")
        .select("*, patients(full_name, phone)")
        .in("queue_status", ["Waiting", "Arriving"]);

      if (error || !activeEntries) {
        if (error) console.error("No-Show Detector: Error fetching queue:", error.message);
        return;
      }

      for (const entry of activeEntries) {
        const createdAt = new Date(entry.created_at);
        // Calculate age of the queue entry in minutes
        const ageMins = (now - createdAt) / (1000 * 60);

        // If the entry has been waiting longer than the threshold without checking in, mark as No-Show
        if (ageMins >= expirationThresholdMins) {
          console.log(`🚨 No-Show Alert: Token #${entry.token_number} (Patient ID: ${entry.patient_id}) exceeded grace period of ${expirationThresholdMins} mins.`);

          // 1. Update database status to No Show
          const { error: updateErr } = await supabase
            .from("queue")
            .update({ queue_status: "No Show", estimated_wait: 0 })
            .eq("id", entry.id);

          if (updateErr) {
            console.error(`No-Show Detector: Failed to update status for token #${entry.token_number}:`, updateErr.message);
            continue;
          }

          // 2. Clear metadata cache
          clearMetadata(entry.id);

          // 3. Dispatch simulated WhatsApp warning
          const patientName = entry.patients?.full_name || "Patient";
          const patientPhone = entry.patients?.phone || "N/A";
          const alertMsg = `Hello ${patientName}, you missed your consultation slot today. Your queue token #${entry.token_number} has been cancelled and marked as No-Show. Please consult the reception desk to reschedule.`;
          
          sendWhatsAppNotification(patientPhone, alertMsg);

          // 4. Shift subsequent queue entries for this doctor
          const { data: remainingQueue } = await supabase
            .from("queue")
            .select("*")
            .eq("doctor_id", entry.doctor_id)
            .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In"])
            .order("token_number");

          if (remainingQueue && remainingQueue.length > 0) {
            const averageConsultationTime = 12;
            for (let i = 0; i < remainingQueue.length; i++) {
              const item = remainingQueue[i];
              const newWait = i * averageConsultationTime;
              await supabase
                .from("queue")
                .update({ estimated_wait: newWait })
                .eq("id", item.id);
            }
            console.log(`🔄 No-Show Detector: Shifted wait times for ${remainingQueue.length} subsequent patients.`);
          }
        }
      }
    } catch (err) {
      console.error("No-Show Detector error:", err);
    }
  }, checkIntervalMs);
};

module.exports = {
  startNoShowDetection,
};
