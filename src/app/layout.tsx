import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "What Time Is Salah? | Allahabad",
  description: "Accurate prayer timings and mosque directory for Allahabad (Prayagraj). Find Iqamah times and nearby mosques easily.",
};

export const viewport: Viewport = {
  themeColor: "#047A55",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {/* 3D Animated Background */}
        <div className="bg-canvas">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
          <div className="bg-orb bg-orb-4" />
          <div className="bg-diamond bg-diamond-1" />
          <div className="bg-diamond bg-diamond-2" />
          <div className="bg-diamond bg-diamond-3" />
          <div className="bg-grid">
            <div className="bg-grid-inner" />
          </div>
        </div>
        <TopNav />
        <div className="app-container">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
