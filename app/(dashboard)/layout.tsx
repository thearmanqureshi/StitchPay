"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      }
    };

    checkSession();
  }, [router]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#111827",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>StitchPay</h2>
        <p style={{ marginTop: "20px" }}>Dashboard</p>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "40px", background: "#f9fafb" }}>
        {children}
      </main>
    </div>
  );
}