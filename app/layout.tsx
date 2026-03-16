import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./auth.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    template: "%s · StitchPay",
    default: "StitchPay",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}