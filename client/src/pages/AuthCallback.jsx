import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * AuthCallback — handles the Google OAuth redirect.
 * Supabase appends #access_token=... to the URL after Google login.
 * We extract the session, save to localStorage, then route to the correct dashboard.
 */
function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Completing sign-in with Google...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically reads the hash fragment and sets the session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("OAuth callback error:", error);
          setStatus("Sign-in failed. Redirecting...");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (data?.session) {
          const session = data.session;
          const user = session.user;

          // Save auth data to localStorage (matching existing app convention)
          localStorage.setItem("token", session.access_token);
          localStorage.setItem("userId", user.id);
          localStorage.setItem("userEmail", user.email);
          localStorage.setItem(
            "userName",
            user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User"
          );

          // Google OAuth users default to "Patient" role
          // (Admins/Doctors still use email/password login)
          const role = user.user_metadata?.role || "Patient";
          localStorage.setItem("userRole", role);

          // Ensure the user exists in the users + patients tables
          // (first-time Google login only — safe to call multiple times)
          try {
            const { data: existingUser } = await supabase
              .from("users")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();

            if (!existingUser) {
              await supabase.from("users").insert([
                {
                  id: user.id,
                  full_name:
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "Google User",
                  email: user.email,
                  role: "Patient",
                  phone: "",
                },
              ]);

              await supabase.from("patients").insert([
                {
                  id: user.id,
                  full_name:
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "Google User",
                  email: user.email,
                  phone: "",
                  age: 25,
                  gender: "Male",
                  address: "",
                },
              ]);
            }
          } catch (dbErr) {
            console.warn("DB upsert warning (non-blocking):", dbErr.message);
          }

          setStatus("Sign-in successful! Redirecting...");

          // Route based on role
          if (role === "Doctor") navigate("/doctor-dashboard");
          else if (role === "Hospital Admin") navigate("/admin-dashboard");
          else navigate("/book-appointment");
        } else {
          setStatus("No session found. Redirecting to login...");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (err) {
        console.error("Unexpected callback error:", err);
        setStatus("Something went wrong. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-6 border border-white max-w-sm w-full mx-6">
        {/* Spinning loader */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">MedFlow AI</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">{status}</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
