import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, createUserWithEmailAndPassword, firestore } from "../firebase/config";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getUserDocRef } from "../firebase/userPaths";
import { Mail, Lock, UserPlus, ChevronDown, User, CheckCircle } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        email: cred.user.email,
        name,
        role,
        createdAt: new Date(),
      };

      // Doctors require admin approval before they can log in
      if (role === "doctor") {
        userData.status = "pending";
      }

      // Write to role-based subcollection: users/{role}/accounts/{uid}
      await setDoc(getUserDocRef(role, cred.user.uid), userData);

      if (role === "doctor") {
        await setDoc(doc(firestore, "doctors", cred.user.uid), {
          name,
          email: cred.user.email,
          specialty: "",
          clinicInfo: null,
          availability: [],
          createdAt: new Date(),
        }, { merge: true });
      }

      if (role === "doctor") {
        // Sign out immediately — they can't use the app until approved
        await signOut(auth);
        setPendingMessage(true);
      } else if (role === "patient") {
        navigate("/patient/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("This email is already registered.");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError("Something went wrong.");
    } finally { setLoading(false); }
  };

  // Show pending approval screen after successful doctor signup
  if (pendingMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ background: "var(--bg-primary)" }}>
        <div className="bg-mesh" />
        <div className="relative z-10 w-full max-w-md animate-fade-in-up">
          <div className="glass-strong p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
              <CheckCircle className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Account Created!</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Your doctor account is <span className="font-semibold text-amber-600">pending admin approval</span>.
              You will be able to sign in once an administrator approves your account.
            </p>
            <button onClick={() => navigate("/login")} className="btn-gradient w-full py-3.5">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-center mb-8">
          <img src="/images/logo-stacked.png" alt="EczeMate+" style={{ height: "180px" }} />
        </div>

        <div className="glass-strong p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Create Account</h2>
            <p style={{ color: "var(--text-secondary)" }}>Join EczeMate+ today</p>
          </div>

          {error && <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" style={{ paddingLeft: "44px" }} placeholder="Your full name" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark" style={{ paddingLeft: "44px" }} placeholder="you@email.com" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" style={{ paddingLeft: "44px" }} placeholder="••••••••" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Role</label>
              <div className="relative">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="input-dark appearance-none pr-10 cursor-pointer">
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>

            {role === "doctor" && (
              <div className="p-3 rounded-xl text-sm bg-amber-50 text-amber-700 border border-amber-100">
                ⚠️ Doctor accounts require admin approval before you can sign in.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gradient w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? "Creating..." : <><UserPlus className="h-4 w-4" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <a href="/login" className="text-sky-600 hover:text-sky-500 font-medium transition">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
