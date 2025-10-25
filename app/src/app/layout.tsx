import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "EventFoundry - Forge Extraordinary Events",
  description: "Forge extraordinary events with master craftsmen. Plan in minutes, compare bids, book with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased font-sans">
        <AuthProvider>
          <ScrollToTop />
          <Navbar />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}