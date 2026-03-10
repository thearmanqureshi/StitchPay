"use client";

import Header from "@/components/dashboard/Header";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header
        title="Monthly Wages"
        section="Payroll"
        subSection="Wages"
        exportAction={{ label: "Export", onClick: () => {} }}
        action={{ label: "Generate Sheet", onClick: () => {} }}
      />

      <div className="page-content">
        
      </div>
    </>
  );
}
