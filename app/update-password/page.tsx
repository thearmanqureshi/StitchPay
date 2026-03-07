"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth-layout";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleUpdate = async () => {
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      alert("Error updating password");
    } else {
      alert("Password updated successfully");
      router.push("/login");
    }
  };

  if (checking) return null;

  return (
    <AuthLayout>
      <div>

        <div className="icon-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
        </div>

        <div className="form-header">
          <h2>Create a new password</h2>
          <p>Enter and confirm your new StitchPay password.</p>
        </div>

        <div className="field">
          <label>New password</label>
          <div className="input-wrap">
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Confirm password</label>
          <div className="input-wrap">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p className="field-hint">
            Password must be at least 6 characters.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>

      </div>
    </AuthLayout>
  );
}