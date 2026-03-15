"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("");

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, organization_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          const name = profile.organization_name ?? "";
          const email = profile.email ?? "";
          setUserName(name);
          setUserEmail(email);
          const parts = name.trim().split(" ");
          const initials =
            parts.length >= 2
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`
              : (parts[0]?.slice(0, 2) ?? "??");
          setUserInitials(initials.toUpperCase());
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navContent = (
    <>
      <nav className="sidebar-nav">
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
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />

              <path d="M8 7h8" />
              <path d="M8 10h8" />
              <path d="M8 13h4a3 3 0 0 0 0-6" />
              <line x1="8" y1="13" x2="15" y2="19" />
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

      <div className="sidebar-footer">
        <div className="user-wrapper">
          {menuOpen && (
            <div className="user-popup">
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
          <button className="user-chip" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar">{userInitials}</div>
            <div className="user-info">
              <p className="user-name">{userName}</p>
              <p className="user-role">{userEmail}</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="sidebar desktop-sidebar">
        <div className="sidebar-logo">
          <Image
            src="/Logo.jpeg"
            alt="StitchPay"
            width={170}
            height={50}
            priority
          />
        </div>
        {navContent}
      </aside>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`sidebar mobile-drawer ${drawerOpen ? "drawer-open" : ""}`}
      >
        <div className="sidebar-logo">
          <Image
            src="/Logo.jpeg"
            alt="StitchPay"
            width={170}
            height={50}
            priority
          />
        </div>
        {navContent}
      </aside>

      <button
        className="hamburger"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </>
  );
}
