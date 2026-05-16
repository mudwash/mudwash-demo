import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import Script from 'next/script';

import { AuthProvider } from "@/lib/AuthContext";
import PWAWrapper from "@/components/PWAWrapper";
import Navbar from "@/components/Navbar";

const montserrat = Montserrat({
  variable: "--font-montserrat",
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
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-Z69KZY7F3Y" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-Z69KZY7F3Y');
          `}
        </Script>
      </head>
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
