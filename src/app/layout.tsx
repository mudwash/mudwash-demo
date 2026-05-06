import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import Script from 'next/script';

import { AuthProvider } from "@/lib/AuthContext";
import PWAWrapper from "@/components/PWAWrapper";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MUDWASH | Premium Auto Detailing",
  description: "High-end automotive detailing, ceramic coating, and interior restoration services.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MUDWASH",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#f69621",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="pwa-init" strategy="afterInteractive">
          {`
            // Capture Install Prompt
            window.addEventListener('beforeinstallprompt', function(e) {
              e.preventDefault();
              window.deferredPrompt = e;
              // Dispatch custom event for the PWA component
              window.dispatchEvent(new Event('beforeinstallprompt-captured'));
            });
          `}
        </Script>
        <AuthProvider>
          <PWAWrapper />
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
