"use client";

import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* LEFT */}
      <section className="left">
        <div className="grid-lines"></div>

        <div className="logo">
          <Image src="/Logo.jpeg" alt="StitchPay" width={170} height={50} priority />
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
            <div className="stat-num">Auto</div>
            <div className="stat-label">Wage Calculations</div>
          </div>

          <div className="stat">
            <div className="stat-num">Email</div>
            <div className="stat-label">Payslips sent in one click</div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* RIGHT */}
      <section className="right">{children}</section>
    </>
  );
}