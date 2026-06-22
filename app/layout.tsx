import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MotivAI",
  description: "Unleash your productivity potential",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <div className="relative min-h-screen">
        <div 
  className="fixed inset-0 pointer-events-none"
  style={{
    backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
    backgroundSize: '30px 30px'
  }}
/>
          {children}
        </div>
      </body>
    </html>
  );
}