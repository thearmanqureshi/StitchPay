"use client";

import Header from "@/components/dashboard/Header";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Header
        title="Styles"
        section="Management"
        subSection="Styles"
        exportAction={{ label: "Export", onClick: () => {} }}
        action={{ label: "Add Style", onClick: () => {} }}
      />

      <div className="page-content">
        
      </div>
    </>
  );
}
