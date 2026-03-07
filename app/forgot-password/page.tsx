"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://stitchpay.vercel.app/update-password",
    });

    if (error) {
      setMessage("Something went wrong. Try again.");
    } else {
      setMessage("Password reset email sent.");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "400px", margin: "auto" }}>
      <h2>Reset your password</h2>

      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "20px",
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: "20px",
            padding: "10px 16px",
            width: "100%",
          }}
        >
          Send Reset Link
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </div>
  );
}