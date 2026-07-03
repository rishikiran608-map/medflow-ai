/**
 * Simulated WhatsApp Notification Service for MedFlow AI
 */
const sendWhatsAppNotification = async (phone, message) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  console.log("\n====================================================================");
  console.log("📱 [SIMULATED WHATSAPP NOTIFICATION] Sent to:", phone);
  console.log("💬 Message:", message);
  console.log("====================================================================\n");
  
  return { success: true, provider: "Simulated WhatsApp Gateway" };
};

module.exports = {
  sendWhatsAppNotification,
};
