"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import "@/app/dashboard.css";
import Sidebar from "@/components/dashboard/Sidebar";

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
        router.replace("/login");
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="main">{children}</div>
    </div>
  );
}
