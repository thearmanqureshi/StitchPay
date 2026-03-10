"use client";

import Header from "@/components/dashboard/Header";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header
        title="Payroll Calculation"
        section="Payroll"
        subSection="Calculate"
        exportAction={{ label: "Export", onClick: () => {} }}
        action={{ label: "Recalculate", onClick: () => {} }}
      />

      <div className="page-content">
        
      </div>
    </>
  );
}
