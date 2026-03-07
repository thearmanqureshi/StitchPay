"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth-layout";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Prevent logged-in users from seeing login page
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <AuthLayout>
      <div className="form-header">
        <h2>Welcome back</h2>
        <p>Sign in to your StitchPay account</p>
      </div>

      {/* EMAIL */}
      <div className="field" id="field-email">
        <label>Email</label>
        <div className="input-wrap">
          <input
            type="email"
            placeholder="e.g. thearmanqureshi@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="field" id="field-password">
        <label>Password</label>
        <div className="input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="toggle-pw"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        className="btn-primary"
        type="button"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="divider-or">
        <span>or</span>
      </div>

      <button
        className="btn-reset"
        type="button"
        onClick={() => router.push("/reset-password")}
      >
        Reset Password
      </button>

      <p className="form-footer">
        Need access?{" "}
        <a href="https://thearmanqureshi.vercel.app/#contactsec">
          Contact the administrator
        </a>
      </p>
    </AuthLayout>
  );
}