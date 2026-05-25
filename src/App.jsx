import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth
const Login    = lazy(() => import("./auth/login.jsx"));
const Signup   = lazy(() => import("./auth/signup.jsx"));

// Main Pages
const Home = lazy(() => import("./pages/home.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));

// Dashboards
const PatientDashboard = lazy(() => import("./pages/dashboard/patientDashboard.jsx"));
const DoctorDashboard  = lazy(() => import("./pages/dashboard/doctorDashboard.jsx"));
const AdminDashboard   = lazy(() => import("./pages/dashboard/AdminDashboard.jsx"));

// Patient Features
const Journal      = lazy(() => import("./features/journal.jsx"));
const AiChat       = lazy(() => import("./features/aichat.jsx"));
const TrackProgress = lazy(() => import("./features/trackprogress.jsx"));

// Doctor Pages
const Appointments  = lazy(() => import("./components/doctor/Appointments.jsx"));
const Patients      = lazy(() => import("./components/doctor/Patients.jsx"));
const Reports       = lazy(() => import("./components/doctor/Reports.jsx"));
const PatientHistory = lazy(() => import("./components/doctor/PatientHistory.jsx"));

// Admin Pages
const ManagePatients     = lazy(() => import("./components/doctor/ManagePatients.jsx"));
const ManageDoctors      = lazy(() => import("./components/doctor/ManageDoctors.jsx"));
const ManageAppointments = lazy(() => import("./components/doctor/ManageAppointments.jsx"));

// Seed (temporary)
const SeedPage = lazy(() => import("./pages/SeedPage.jsx"));

// Loading fallback shown while a lazy chunk is being fetched
const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-primary)" }}>
    <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public Routes */}
          <Route path="/"element={<Home />} />
          <Route path="/login"element={<Login />} />
          <Route path="/signup"element={<Signup />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/journal"element={<Journal />} />
          <Route path="/aichat"element={<AiChat />} />
          <Route path="/trackprogress"element={<TrackProgress />} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard"element={<DoctorDashboard />} />
          <Route path="/doctor/appointments"element={<Appointments />} />
          <Route path="/doctor/patients"element={<Patients />} />
          <Route path="/doctor/reports"element={<Reports />} />
          <Route path="/doctor/patient/:patientId"element={<PatientHistory />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard"element={<AdminDashboard />} />
          <Route path="/admin/patients"element={<ManagePatients />} />
          <Route path="/admin/doctors"element={<ManageDoctors />} />
          <Route path="/admin/appointments" element={<ManageAppointments />} />

          {/* Seed (temporary) */}
          <Route path="/seed" element={<SeedPage />} />

        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;