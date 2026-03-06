"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

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
    <>
      {/* LEFT */}
      <section className="left">
        <div className="grid-lines"></div>

        <div className="logo">
          <Image
            src="/Logo.png"
            alt="StitchPay"
            width={140}
            height={40}
            priority
          />
        </div>

        <div className="hero-copy">
          <h1>
            Every stitch.
            <br />
            <em>Every rupee.</em>
            <br />
            Accounted for.
          </h1>
          <p>
            Built for garment units and tailoring workshops — StitchPay tracks
            piece-rate output per worker and converts it into accurate wages
            automatically. No more manual registers, no more calculation errors.
          </p>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="stat-num">Zero</div>
            <div className="stat-label">Manual Errors</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <div className="stat-label">Worker Clarity</div>
          </div>
          <div className="stat">
            <div className="stat-num">Piece-rate</div>
            <div className="stat-label">Auto Wage Calc</div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* RIGHT */}
      <section className="right">
        <div className="form-header">
          <h2>Welcome back</h2>
          <p>Sign in to your StitchPay account</p>
        </div>

        <div className="field" id="field-email">
          <label>Email</label>
          <div className="input-wrap">
            <input
              type="email"
              placeholder="e.g. thearmanqureshi@stitchpay.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

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

        <button className="btn-reset" type="button">
          Reset Password
        </button>

        <p className="form-footer">
          Need access? <a href="https://thearmanqureshi.vercel.app/#contactsec">Contact the administrator</a>
        </p>
      </section>
    </>
  );
}
