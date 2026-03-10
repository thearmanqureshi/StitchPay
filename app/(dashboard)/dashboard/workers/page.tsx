"use client";

import Header from "@/components/dashboard/Header";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header
        title="Workers"
        section="Management"
        subSection="Workers"
        exportAction={{ label: "Export", onClick: () => {} }}
        action={{ label: "Add Worker", onClick: () => {} }}
      />

      <div className="page-content">
        
      </div>
    </>
  );
}
