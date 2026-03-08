import "@/app/dashboard.css";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="main">
        {children}
      </div>
    </div>
  );
}