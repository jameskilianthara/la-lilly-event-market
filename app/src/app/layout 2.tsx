import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "La-Lilly - We are the Craftsmen",
  description: "Craftsmen behind your dream events. Plan in minutes, transparent bidding, trusted vendors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}