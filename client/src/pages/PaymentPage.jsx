import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ShieldCheck, CheckCircle2, Loader2, ArrowRight, Zap } from "lucide-react";
import { toast } from "sonner";

function PaymentPage() {
  const { id } = useParams(); // appointment ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        const res = await api.get("/queue/active");
        if (res.data && res.data.appointment_id === id) {
          setAppointment(res.data);
        } else {
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

  // Fallback mocks if doctor details are not fully populated
  const docName = appointment?.doctors?.full_name || "Specialist Consultation";
  const docFee = appointment?.doctors?.consultation_fee || 250;
  const platformFee = 45;
  const gstFee = Math.round(docFee * 0.18);
  const totalAmount = docFee + platformFee + gstFee;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Step 1: Create Razorpay order via backend
      const orderRes = await api.post("/payments/create-order", {
        appointment_id: id,
        amount: totalAmount,
      });

      if (!orderRes.data.success) {
        throw new Error("Failed to create payment order");
      }

      const { order_id, key_id, amount: orderAmount, currency } = orderRes.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: key_id,
        amount: orderAmount,
        currency: currency,
        name: "MedFlow AI",
        description: `Consultation — Dr. ${docName}`,
        order_id: order_id,
        handler: async (response) => {
          // Step 3: Verify payment signature on backend
          try {
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: id,
            });

            if (verifyRes.data.success) {
              setPaymentId(response.razorpay_payment_id);
              setPaymentSuccess(true);
              toast.success("Payment verified via Razorpay! Token activated.");
              setTimeout(() => {
                navigate("/patient-dashboard");
              }, 2500);
            } else {
              toast.error("Payment verification failed. Contact support.");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            toast.error("Payment verification failed.");
          }
          setProcessing(false);
        },
        prefill: {
          name: localStorage.getItem("userName") || "Patient",
          email: localStorage.getItem("userEmail") || "",
        },
        theme: {
          color: "#2563EB",
          backdrop_color: "rgba(0, 0, 0, 0.7)",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment failed:", err);
      toast.error("Payment initiation failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleDemoBypass = async () => {
    setProcessing(true);
    try {
      await api.put(`/appointments/pay/${id}`);
      setPaymentSuccess(true);
      toast.success("Demo Mode: Payment bypassed successfully!");
      setTimeout(() => {
        navigate("/patient-dashboard");
      }, 2000);
    } catch (err) {
      console.error("Bypass failed:", err);
      toast.error("Bypass failed. Please try again.");
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
              <p className="text-slate-400 text-xs mt-1.5 font-medium flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" />
                Powered by Razorpay — India's most trusted payment gateway
              </p>

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

              {/* Razorpay Badge */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-sm">R</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Razorpay Secure Checkout</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">UPI • Cards • Net Banking • Wallets — All payment modes supported</p>
                  </div>
                </div>
              </div>

              {/* Bottom security actions */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                  <ShieldCheck size={16} className="text-green-600" />
                  <span>PCI-DSS compliant • SSL encrypted • RBI-regulated</span>
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
                      <span>Opening Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount} via Razorpay</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDemoBypass}
                  disabled={processing}
                  className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 text-xs border border-slate-200"
                >
                  <span>⚡ Fast Checkout (Demo Bypass)</span>
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
                Consultation payment received via Razorpay. Your queue token is now active. Redirecting to dashboard...
              </p>
              {paymentId && (
                <p className="text-[10px] text-slate-300 mt-3 font-mono">
                  Transaction ID: {paymentId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default PaymentPage;
