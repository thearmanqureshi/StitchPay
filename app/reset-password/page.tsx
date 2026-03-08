"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/login/auth-layout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSend = async () => {
    if (!email.includes("@")) return;

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://stitchpay.vercel.app/update-password",
    });

    setLoading(false);

    if (!error) {
      alert("Reset link sent. Check your email.");
      router.push("/login");
    } else {
      alert("Something went wrong.");
    }
  };

  return (
    <AuthLayout>
      <div id="step-request">
        <div className="icon-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>

        <div className="form-header">
          <h2>Reset your password</h2>
          <p>
            Enter the email linked to your StitchPay account and we’ll send
            you a reset link.
          </p>
        </div>

        <div className="field" id="field-email">
          <label>Email address</label>

          <div className="input-wrap">
            <input
              type="email"
              placeholder="e.g. thearmanqureshi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <p className="field-hint">
            We'll only send a reset link if this email is registered.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>

        <button
          className="btn-ghost back-btn"
          onClick={() => router.push("/login")}
        >
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Sign In
        </button>
      </div>
    </AuthLayout>
  );
}