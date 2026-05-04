import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth
import Login from "./auth/login.jsx";
import Signup from "./auth/signup.jsx";

// Main Pages
import Home from "./pages/home.jsx";

// Dashboards
import PatientDashboard from "./pages/dashboard/patientDashboard.jsx";
import DoctorDashboard from "./pages/dashboard/doctorDashboard.jsx";

// Doctor Pages
import Appointments from "./features/Appointments.jsx";
import Patients from "./components/Patients.jsx";
import Reports from "./components/Reports.jsx";
import Settings from "./components/Settings.jsx";
import PatientHistory from "./components/PatientHistory.jsx";

// Admin Pages
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import ManagePatients from "./components/ManagePatients.jsx";
import ManageDoctors from "./components/ManageDoctors.jsx";
import ManageAppointments from "./components/ManageAppointments.jsx";

// Features";
import Journal from "./features/journal.jsx";
import Aichatbox from "./features/aichat.jsx";
import Trackprogress from "./features/trackprogress.jsx";

// Seed (temporary)
import SeedPage from "./pages/SeedPage.jsx";

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Patient */}
        <Route path="/patientDashboard" element={<PatientDashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/aichat" element={<Aichatbox />} />
        <Route path="/trackprogress" element={<Trackprogress />} />

        {/* Doctor Main Dashboard */}
        <Route path="/doctorDashboard" element={<DoctorDashboard />} />

        {/* Doctor Sub Pages */}
        <Route path="/doctor/appointments" element={<Appointments />} />
        <Route path="/doctor/patients" element={<Patients />} />
        <Route path="/doctor/reports" element={<Reports />} />
        <Route path="/doctor/settings" element={<Settings />} />
        <Route path="/doctor/patient/:patientId" element={<PatientHistory />} />

        {/* Admin Sub Pages */}
        <Route path="/adminDashboard" element={<AdminDashboard />} />
        <Route path="/admin/patients" element={<ManagePatients />} />
        <Route path="/admin/doctors" element={<ManageDoctors />} />
        <Route path="/admin/appointments" element={<ManageAppointments />} />

        {/* Seed (temporary) */}
        <Route path="/seed" element={<SeedPage />} />

      </Routes>
    </Router>
  );
}

export default App;