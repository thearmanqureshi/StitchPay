"use client";

import Header from "@/components/dashboard/Header";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header
        title="Production Entries"
        section="Payroll"
        subSection="Production"
        exportAction={{ label: "Export", onClick: () => {} }}
        action={{ label: "Log Entry", onClick: () => {} }}
      />

      <div className="page-content">
        
      </div>
    </>
  );
}
