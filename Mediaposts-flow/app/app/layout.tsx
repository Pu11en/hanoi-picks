import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mediaposts Flow — Hanoi Picks",
  description: "Pick → Script → Voice → Video",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <nav style={{
          display: "flex", alignItems: "center", gap: 24,
          padding: "18px 0 14px", borderBottom: "1px solid var(--border)",
          marginBottom: 32
        }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)", letterSpacing: "-0.02em" }}>
            HANOI PICKS
          </span>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Mediaposts Flow</span>
        </nav>
        {children}
        <div style={{ height: 60 }} />
      </body>
    </html>
  );
}
