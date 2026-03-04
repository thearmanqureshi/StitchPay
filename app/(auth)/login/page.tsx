"use client";

import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* LEFT */}
      <section className="left">
        <div className="grid-lines"></div>

        <div className="logo">
          <div className="logo-icon">
            <span>SP</span>
          </div>
          <span className="logo-name">StitchPay</span>
        </div>

        <div className="hero-copy">
          <h1>
            Wages,<br />
            <em>woven</em><br />
            with precision.
          </h1>
          <p>
            Manage monthly payroll, track disbursements, and keep every
            thread of your workforce finances in order — all in one place.
          </p>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="stat-num">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat">
            <div className="stat-num">2 min</div>
            <div className="stat-label">Avg. Payout</div>
          </div>
          <div className="stat">
            <div className="stat-num">ISO 27001</div>
            <div className="stat-label">Certified</div>
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

        <div className="field">
          <label>Email</label>
          <div className="input-wrap">
            <input type="email" placeholder="e.g. john@company.com" />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div className="input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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

        <button className="btn-primary" type="button">
          Sign In
        </button>

        <div className="divider-or">
          <span>or</span>
        </div>

        <button className="btn-reset" type="button">
          Reset Password
        </button>

        <p className="form-footer">
          Need access? <a href="#">Contact your administrator</a>
        </p>
      </section>
    </>
  );
}