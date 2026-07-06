import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookAppointment from "./pages/BookAppointment";
import PaymentPage from "./pages/PaymentPage";
import ChatWidget from "./components/ChatWidget";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/patient-dashboard"
          element={<ProtectedRoute allowedRoles={["Patient"]}><PatientDashboard /></ProtectedRoute>}
        />

        <Route
          path="/doctor-dashboard"
          element={<ProtectedRoute allowedRoles={["Doctor"]}><DoctorDashboard /></ProtectedRoute>}
        />

        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute allowedRoles={["Hospital Admin"]}><AdminDashboard /></ProtectedRoute>}
        />

        <Route
          path="/book-appointment"
          element={<ProtectedRoute allowedRoles={["Patient"]}><BookAppointment /></ProtectedRoute>}
        />

        <Route
          path="/payment/:id"
          element={<ProtectedRoute allowedRoles={["Patient"]}><PaymentPage /></ProtectedRoute>}
        />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;
