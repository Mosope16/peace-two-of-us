import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "TwoOfUs - Private Long Distance Relationship Space",
  description: "A private digital space where two people can preserve memories, keep track of important dates, exchange love letters, and stay emotionally connected.",
};

export const viewport = {
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
    <html lang="en" className="dark">
      <body className="antialiased min-height-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="py-6 border-t border-rose-500/10 text-center text-xs text-zinc-500 glass-nav">
          <p>Made with ❤️ for Long Distance Couples &bull; TwoOfUs MVP</p>
        </footer>
      </body>
    </html>
  );
}
