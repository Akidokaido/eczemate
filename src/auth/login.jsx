import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase/config";
import { signOut } from "firebase/auth";
import { findUserByUid } from "../firebase/userPaths";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // Search all role subcollections to find the user
      const result = await findUserByUid(cred.user.uid);

      if (result) {
        const { data, role } = result;

        // Doctor approval gate
        if (role === "doctor") {
          const status = data.status || "pending";
          if (status === "pending") {
            await signOut(auth);
            setError("Your account is pending admin approval. Please wait for an administrator to approve your account.");
            return;
          }
          if (status === "rejected") {
            await signOut(auth);
            setError("Your account application has been rejected. Please contact the administrator for more information.");
            return;
          }
          // status === "approved" → proceed
        }

        if (role === "patient") navigate("/patient/dashboard");
        else if (role === "doctor") navigate("/doctor/dashboard");
        else if (role === "admin") navigate("/admin/dashboard");
      } else {
        setError("Account not found. Please sign up first.");
      }
    } catch (err) { setError("Invalid email or password."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-center mb-8">
          <img src="/images/logo-stacked.png" alt="EczeMate+" style={{ height: "180px" }} />
        </div>

        <div className="glass-strong p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Welcome back</h2>
            <p style={{ color: "var(--text-secondary)" }}>Sign in to your account</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
            <button type="submit" disabled={loading} className="btn-gradient w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? "Signing in..." : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <a href="/signup" className="text-sky-600 hover:text-sky-500 font-medium transition">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;