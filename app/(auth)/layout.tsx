import type { Metadata } from "next";
export const metadata: Metadata = { title: "Login" };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}