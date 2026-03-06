"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>StitchPay Dashboard</h1>
      <p>Workforce payroll control center.</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 16px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}