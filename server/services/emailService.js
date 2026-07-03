/**
 * Simulated Email Notification Service for MedFlow AI
 */
const sendEmailNotification = async (email, subject, body) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  console.log("\n====================================================================");
  console.log("✉️ [SIMULATED EMAIL NOTIFICATION] Sent to:", email);
  console.log("📌 Subject:", subject);
  console.log("📝 Body:", body);
  console.log("====================================================================\n");
  
  return { success: true, provider: "Simulated SMTP Gateway" };
};

module.exports = {
  sendEmailNotification,
};
