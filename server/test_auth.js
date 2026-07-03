const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  console.log("Supabase URL:", process.env.SUPABASE_URL);
  console.log("Supabase Anon Key length:", process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0);

  // Sign up/in
  const email = `test_user_${Date.now()}@example.com`;
  const password = "password123";

  console.log("Creating test user:", email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("Sign Up Error:", signUpError);
    return;
  }

  const token = signUpData.session?.access_token;
  console.log("Sign Up success. Token exists:", !!token);

  let verifiedToken = token;
  if (!token) {
    console.log("No session returned. Attempting sign in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Sign In Error:", signInError);
      return;
    }

    verifiedToken = signInData.session?.access_token;
    console.log("Sign In Success. Token exists:", !!verifiedToken);
  }
  
  // Now verify the token
  console.log("Verifying token...");
  const { data: userData, error: userError } = await supabase.auth.getUser(verifiedToken);
  if (userError) {
    console.error("getUser Error:", userError);
  } else {
    console.log("getUser Success. User ID:", userData.user?.id);
  }
}

test().catch(console.error);
