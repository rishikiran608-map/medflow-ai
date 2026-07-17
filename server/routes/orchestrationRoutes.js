const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { orchestrateChat } = require("../services/agentOrchestrator");
const { analyzePrescriptionHandwriting, analyzeSymptomCameraPhoto } = require("../services/visionAgent");
const { supabaseAdmin } = require("../config/supabase");

// 1. Unified Agent Orchestrator Chat Endpoint
router.post("/chat", authMiddleware, async (req, res) => {
  const { message, conversationId, language } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  const userId = req.user.id;
  const userRole = req.user.role || "Patient";
  
  // Use user ID as conversation thread if not supplied
  const activeThread = conversationId || userId;

  try {
    const response = await orchestrateChat({
      message,
      userId,
      userRole,
      conversationId: activeThread,
      language: language || "en"
    });
    
    res.json({ success: true, ...response });
  } catch (err) {
    console.error("Orchestrator Route error:", err.message);
    res.status(500).json({ success: false, message: "Failed to process message through Orchestrator" });
  }
});

// 2. OCR Handwriting Prescription Extraction
router.post("/vision/prescription", authMiddleware, async (req, res) => {
  const { base64Image, mimeType } = req.body;
  if (!base64Image) {
    return res.status(400).json({ success: false, message: "Image data is required" });
  }

  try {
    const extraction = await analyzePrescriptionHandwriting(base64Image, mimeType);
    
    // Automatically register as a pending approval request for Pharmacists / Doctors
    const userRole = req.user.role || "Patient";
    if (userRole === "Pharmacist" || userRole === "Doctor") {
      const { data: approval } = await supabaseAdmin
        .from("clinical_approvals")
        .insert([{
          requester_id: req.user.id,
          requester_role: userRole,
          approver_role: "Doctor",
          status: "Pending",
          action_type: "Write Prescription",
          action_payload: extraction
        }])
        .select()
        .single();
      
      return res.json({ success: true, extraction, approvalId: approval?.id || null });
    }

    res.json({ success: true, extraction });
  } catch (err) {
    console.error("Prescription Vision route error:", err.message);
    res.status(500).json({ success: false, message: "Vision agent failed to process prescription" });
  }
});

// 3. Symptom Camera Analyzer
router.post("/vision/symptom", authMiddleware, async (req, res) => {
  const { base64Image, mimeType } = req.body;
  if (!base64Image) {
    return res.status(400).json({ success: false, message: "Image data is required" });
  }

  try {
    const analysis = await analyzeSymptomCameraPhoto(base64Image, mimeType);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Symptom Vision route error:", err.message);
    res.status(500).json({ success: false, message: "Vision agent failed to analyze symptom" });
  }
});

// 4. Submit clinical modifications (Finalizing approvals or user overrides)
router.post("/approve", authMiddleware, async (req, res) => {
  const { approvalId, status, payload } = req.body;
  const userRole = req.user.role;
  const userId = req.user.id;

  if (userRole !== "Doctor" && userRole !== "Hospital Admin") {
    return res.status(403).json({ success: false, message: "Unauthorized to approve clinical items" });
  }

  try {
    // 1. If approval record exists, update it
    if (approvalId) {
      await supabaseAdmin
        .from("clinical_approvals")
        .update({
          status: status || "Approved",
          approver_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq("id", approvalId);
    }

    // 2. Perform DB operations matching action payload (e.g. Save Prescription)
    if (status === "Approved" && payload) {
      const patientId = payload.patientId || userId;
      
      if (payload.medicines && payload.medicines.length > 0) {
        // Insert into prescriptions table
        const rows = payload.medicines.map(m => ({
          patient_id: patientId,
          doctor_id: userId,
          medicine_name: m.name,
          dosage: m.dosage + " (" + (m.frequency || "Once daily") + ")",
          is_active: true,
          medication_schedule: { frequency: m.frequency, duration: m.duration },
          remaining_doses: 30
        }));

        await supabaseAdmin.from("prescriptions").insert(rows);
      }
    }

    res.json({ success: true, message: `Action status updated to ${status}` });
  } catch (err) {
    console.error("Approve Route error:", err.message);
    res.status(500).json({ success: false, message: "Approval operations failed" });
  }
});

// 5. Query Audit Logs (Restricted to Admins and Owners)
router.get("/audit", authMiddleware, async (req, res) => {
  const userRole = req.user.role;
  if (userRole !== "Hospital Admin" && userRole !== "Clinic Owner") {
    return res.status(403).json({ success: false, message: "Access Denied: HIPAA Auditor Scope Required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json({ success: true, logs: data || [] });
  } catch (err) {
    console.error("Audit Route error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch audit log database entries" });
  }
});

module.exports = router;
