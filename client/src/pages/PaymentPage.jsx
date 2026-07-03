import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShieldCheck, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

function PaymentPage() {
  const { id } = useParams(); // appointment ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        // Fetch queue details associated with this appointment
        const res = await api.get("/queue/active");
        if (res.data && res.data.appointment_id === id) {
          setAppointment(res.data);
        } else {
          // Fallback or fetch from queue list
          const queueList = await api.get("/queue");
          const matched = queueList.data.find(q => q.appointment_id === id);
          if (matched) {
            setAppointment(matched);
          }
        }
      } catch (err) {
        console.error("Failed to fetch checkout details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [id]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simulate secure network transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call payment activation endpoint
      await api.put(`/appointments/pay/${id}`);
      
      setPaymentSuccess(true);
      setTimeout(() => {
        navigate("/patient-dashboard");
      }, 2000);
    } catch (err) {
      console.error("Payment failed:", err);
      alert("⚠️ Payment transaction failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Fallback mocks if doctor details are not fully populated
  const docName = appointment?.doctors?.full_name || "Specialist Consultation";
  const docFee = appointment?.doctors?.consultation_fee || 500;
  const platformFee = 45;
  const gstFee = Math.round(docFee * 0.18);
  const totalAmount = docFee + platformFee + gstFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 py-12 px-6 flex items-center justify-center font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-2xl -z-10"></div>
        
        <AnimatePresence mode="wait">
          {!paymentSuccess ? (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 md:p-10 text-left"
            >
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={24} />
                Secure Checkout Gateway
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 font-medium">Verify your bill and process secure consultation payment to activate your token.</p>

              {/* Bill Details */}
              <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Summary of Consultation</h3>
                
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                  <span className="text-sm font-semibold text-slate-700">{docName}</span>
                  <span className="text-sm font-extrabold text-slate-800">₹{docFee}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-200/50">
                  <span className="text-xs text-slate-500 font-semibold">MedFlow Booking Fee</span>
                  <span className="text-xs font-bold text-slate-700">₹{platformFee}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-200/50">
                  <span className="text-xs text-slate-500 font-semibold">GST Charges (18%)</span>
                  <span className="text-xs font-bold text-slate-700">₹{gstFee}</span>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-sm font-bold text-slate-800">Total Payable Amount</span>
                  <span className="text-xl font-black text-blue-600">₹{totalAmount}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-8">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "upi", label: "UPI 📱" },
                    { id: "card", label: "Card 💳" },
                    { id: "net", label: "Net 🏦" }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`py-3.5 rounded-xl border font-bold text-xs transition flex flex-col items-center justify-center gap-1.5 ${
                        paymentMethod === method.id 
                          ? "border-blue-600 bg-blue-50/50 text-blue-600 font-black" 
                          : "border-slate-100 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom security actions */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                  <ShieldCheck size={16} className="text-green-600" />
                  <span>SSL Encrypted secure checkout transaction</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Transaction...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 border border-green-200">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Payment Verified!</h2>
              <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                Consultation payment received. Your queue token is now active. Redirecting to dashboard...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default PaymentPage;
