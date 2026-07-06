const { seedDemoData } = require("../controllers/queueController");

const req = {};
const res = {
  json: (data) => console.log("SUCCESS:", JSON.stringify(data, null, 2)),
  status: (code) => {
    console.log("STATUS CODE:", code);
    return {
      json: (data) => console.log("FAILURE:", JSON.stringify(data, null, 2))
    };
  }
};

console.log("Running seedDemoData()...");
seedDemoData(req, res).catch(err => {
  console.error("Unhandled promise rejection in seeder:", err);
});
