async function testWalkIn() {
  console.log("--- medflow-ai Walk-in Registration Test ---");
  const baseUrl = "http://localhost:5000/api";

  try {
    // 1. Log in as Hospital Admin
    console.log("1. Logging in as Admin...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@medflow.com",
        password: "admin123"
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));

    const token = loginData.session.access_token;
    console.log("Login successful! Token acquired.");

    // Fetch doctors to get a doctor ID
    console.log("2. Fetching doctor ID...");
    const docsRes = await fetch(`${baseUrl}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const docsData = await docsRes.json();
    if (!docsRes.ok) throw new Error(JSON.stringify(docsData));

    if (docsData.length === 0) {
      throw new Error("No doctors found in the database.");
    }
    const doctorId = docsData[0].id;
    console.log(`Doctor ID: ${doctorId} (${docsData[0].full_name})`);

    // 3. Register a walk-in patient
    console.log("3. Registering walk-in patient...");
    const walkInRes = await fetch(`${baseUrl}/queue/walk-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        full_name: "Walk-in Patient Test",
        phone: "9876543219",
        email: `walkin_test_${Date.now()}@medflow.com`,
        doctor_id: doctorId,
        reason: "Acute severe throat pain"
      })
    });

    const walkInData = await walkInRes.json();
    console.log("Registration Status:", walkInRes.status);
    console.log("Response:", JSON.stringify(walkInData, null, 2));

    if (!walkInRes.ok) throw new Error(JSON.stringify(walkInData));

    console.log("🚀 Walk-in Integration Test SUCCESSFUL!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
}

testWalkIn();
