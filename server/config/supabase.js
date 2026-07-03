const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Client for user authentication (uses anon key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Client for database operations (uses service role key to bypass RLS, falls back to anon key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

console.log("=================================");
console.log("Supabase Clients Initialized:");
console.log("- URL:", process.env.SUPABASE_URL);
console.log("- Admin Key Type:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE" : "ANON");
console.log("=================================");

module.exports = {
  supabase,
  supabaseAdmin,
};