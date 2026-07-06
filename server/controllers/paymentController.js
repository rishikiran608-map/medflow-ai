const Razorpay = require("razorpay");
const crypto = require("crypto");
const { supabaseAdmin: supabase } = require("../config/supabase");
const { sendWhatsAppNotification } = require("../services/whatsappService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {
    const { appointment_id, amount } = req.body;
    if (!appointment_id || !amount) {
      return res.status(400).json({ success: false, message: "appointment_id and amount are required" });
    }
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `medflow_${appointment_id}`,
      notes: { appointment_id, patient_id: req.user?.id || "anonymous", platform: "MedFlow AI" },
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("Razorpay createOrder error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointment_id } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed - invalid signature" });
    }
    const { data: qEntry, error: fetchErr } = await supabase
      .from("queue")
      .select("*, patients(full_name, phone, email), doctors(full_name, consultation_fee)")
      .eq("appointment_id", appointment_id)
      .single();
    if (fetchErr || !qEntry) {
      return res.status(404).json({ success: false, message: "Queue entry not found" });
    }
    await supabase.from("queue").update({ queue_status: "Waiting" }).eq("id", qEntry.id);
    const patientName = qEntry.patients?.full_name || "Patient";
    const patientPhone = qEntry.patients?.phone || "N/A";
    const doctorName = qEntry.doctors?.full_name || "Doctor";
    const fee = qEntry.doctors?.consultation_fee || 250;
    const msg = `✅ Payment Verified via Razorpay!\n\nHello ${patientName}, your consultation payment of ₹${fee} has been confirmed.\n\n🎫 Token: #${qEntry.token_number}\n👨⚕️ Doctor: Dr. ${doctorName}\n⏱️ Est. Wait: ${qEntry.estimated_wait} min\n🧾 Razorpay ID: ${razorpay_payment_id}\n\nPlease arrive on time. - MedFlow AI`;
    sendWhatsAppNotification(patientPhone, msg);
    res.json({ success: true, message: "Payment verified and queue token activated!", payment_id: razorpay_payment_id, queue: qEntry });
  } catch (err) {
    console.error("Razorpay verifyPayment error:", err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

module.exports = { createOrder, verifyPayment };
