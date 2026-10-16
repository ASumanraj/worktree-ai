import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkTree AI - Team Intelligence & Tribal Memory Platform",
  description: "Edge-Native Engineering Memory, Autonomous Standup & Flow Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
