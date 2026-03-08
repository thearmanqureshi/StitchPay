"use client";

import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* LEFT */}
      <section className="left">
        <div className="grid-lines"></div>

        <div className="logo">
          <Image src="/Logo.jpeg" alt="StitchPay" width={140} height={40} priority />
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
      <section className="right">{children}</section>
    </>
  );
}