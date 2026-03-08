"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

export default function Sidebar() {
    const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };


  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <Image src="/Logo.jpeg" alt="StitchPay" width={170} height={50} priority />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* OVERVIEW */}
        <div className="nav-section">
          <p className="nav-label">Overview</p>

          <Link
            href="/dashboard"
            className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>

            <span>Dashboard</span>
          </Link>
        </div>

        {/* MANAGEMENT */}
        <div className="nav-section">
          <p className="nav-label">Management</p>

          <Link
            href="/dashboard/styles"
            className={`nav-item ${isActive("/dashboard/styles") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.2l1.6 9.6A2 2 0 0 0 5.86 20h12.28a2 2 0 0 0 1.98-1.74l1.6-9.6a2 2 0 0 0-1.34-2.2Z" />
            </svg>

            <span>Styles</span>
          </Link>

          <Link
            href="/dashboard/workers"
            className={`nav-item ${isActive("/dashboard/workers") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>

            <span>Workers</span>
          </Link>
        </div>

        {/* PAYROLL */}
        <div className="nav-section">
          <p className="nav-label">Payroll</p>

          <Link
            href="/dashboard/production"
            className={`nav-item ${isActive("/dashboard/production") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>

            <span>Production Entries</span>
          </Link>

          <Link
            href="/dashboard/payroll"
            className={`nav-item ${isActive("/dashboard/payroll") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>

            <span>Payroll Calculation</span>
          </Link>

          <Link
            href="/dashboard/wages"
            className={`nav-item ${isActive("/dashboard/wages") ? "active" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 10h20" />
            </svg>

            <span>Monthly Wages</span>
          </Link>
        </div>
      </nav>

      {/* Bottom User */}
      <div className="sidebar-user">
        <div className="user-wrapper">
          {menuOpen && (
            <div className="user-popup">
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}

          <button className="user-chip" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar">AQ</div>

            <div className="user-info">
              <p className="user-name">Arman Qureshi</p>
              <p className="user-role">thearmanqureshi@gmail.com</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
