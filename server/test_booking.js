const http = require("http");

function jsonRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  const timestamp = Date.now();
  const email = `patient_${timestamp}@example.com`;
  const password = "password123";
  const fullName = `Patient ${timestamp}`;

  console.log("---medflow-ai Integration Test ---");

  // 1. Test Registration
  console.log("1. Registering user...");
  const regResult = await jsonRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }, {
    full_name: fullName,
    email: email,
    password: password,
    role: "Patient",
    phone: "9988776655"
  });
  console.log("Registration Status:", regResult.status);
  console.log("Registration Response:", regResult.body || regResult.raw);

  if (regResult.status !== 201) {
    console.error("Registration failed!");
    return;
  }

  // 2. Test Login
  console.log("\n2. Logging in...");
  const loginResult = await jsonRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  }, {
    email: email,
    password: password
  });
  console.log("Login Status:", loginResult.status);
  console.log("Login Response token exists:", !!loginResult.body?.session?.access_token);

  if (loginResult.status !== 200 || !loginResult.body?.session?.access_token) {
    console.error("Login failed!");
    return;
  }

  const token = loginResult.body.session.access_token;

  // 3. Test Booking Appointment
  console.log("\n3. Booking appointment...");
  const doctorId = "a5915ab4-715f-4e92-b82e-23e0658343f5"; // Dr. Rajesh Kumar
  const bookingResult = await jsonRequest({
    hostname: "localhost",
    port: 5000,
    path: "/api/appointments",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }, {
    doctor_id: doctorId,
    appointment_date: "2026-07-04",
    appointment_time: "14:30:00"
  });

  console.log("Booking Status:", bookingResult.status);
  console.log("Booking Response:", JSON.stringify(bookingResult.body || bookingResult.raw, null, 2));

  if (bookingResult.status === 201) {
    console.log("\n🚀 Integration Test SUCCESSFUL!");
  } else {
    console.error("\n❌ Integration Test FAILED!");
  }
}

runTest().catch((err) => {
  console.error("Test failed with error:", err.message);
});
