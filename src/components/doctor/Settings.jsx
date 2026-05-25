import React from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../DoctorLayout";
import { UserCog, ArrowRight } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <DoctorLayout title="Settings">
      <div className="max-w-lg animate-fade-in-up">
        <div className="glass-strong p-8 space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Account Settings</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage your profile information, including your name, phone number, and specialty, from the Edit Profile page.
          </p>
          <button
            onClick={() => navigate("/edit-profile")}
            className="btn-gradient w-full flex items-center justify-center gap-2 py-3"
          >
            <UserCog className="h-4 w-4" />
            Go to Edit Profile
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Settings;
