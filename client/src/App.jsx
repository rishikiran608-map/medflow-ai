import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import ChatWidget from "./components/ChatWidget";
import CommandPalette from "./components/CommandPalette";
import { Toaster } from "sonner";

// Code splitting (Task 4)
const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PharmacistDashboard = lazy(() => import("./pages/PharmacistDashboard"));
const ClinicOwnerDashboard = lazy(() => import("./pages/ClinicOwnerDashboard"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Only show the floating ChatWidget on the home/landing page.
// Dashboards each have their own embedded AI assistant panel.
function ConditionalChatWidget() {
  const location = useLocation();
  const dashboardPaths = [
    "/patient-dashboard",
    "/doctor-dashboard",
    "/admin-dashboard",
    "/pharmacist-dashboard",
    "/clinic-owner-dashboard",
    "/book-appointment",
  ];
  const isDashboard = dashboardPaths.some(p => location.pathname.startsWith(p));
  if (isDashboard) return null;
  return <ChatWidget />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Navbar />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

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
            path="/pharmacist-dashboard"
            element={<ProtectedRoute allowedRoles={["Pharmacist"]}><PharmacistDashboard /></ProtectedRoute>}
          />

          <Route
            path="/clinic-owner-dashboard"
            element={<ProtectedRoute allowedRoles={["Clinic Owner"]}><ClinicOwnerDashboard /></ProtectedRoute>}
          />

          <Route
            path="/book-appointment"
            element={<ProtectedRoute allowedRoles={["Patient"]}><BookAppointment /></ProtectedRoute>}
          />

          <Route
            path="/payment/:id"
            element={<ProtectedRoute allowedRoles={["Patient"]}><PaymentPage /></ProtectedRoute>}
          />

          {/* Custom 404 Route (Task 3) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ConditionalChatWidget />
      <CommandPalette />
    </BrowserRouter>
  );
}

export default App;
