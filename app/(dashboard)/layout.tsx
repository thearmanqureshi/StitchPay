export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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