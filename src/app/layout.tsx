import type { Metadata } from "next";
import "./globals.css";
import dynamic from 'next/dynamic';
import Script from 'next/script';

import { AuthProvider } from "@/lib/AuthContext";
import PWAWrapper from "@/components/PWAWrapper";
import Navbar from "@/components/Navbar";
import { TrackingProvider } from "@/lib/TrackingContext";

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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap" rel="stylesheet" />
        {/* Hide Next.js dev build indicator (the % LOADING pill) */}
        <style>{`
          nextjs-portal,
          #__next-build-indicator,
          [data-nextjs-dialog-overlay],
          [data-nextjs-build-indicator],
          next-route-announcer,
          #__NEXT_DATA__ ~ nextjs-portal { display: none !important; }
        `}</style>
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
            gtag('config', 'AW-17073511250');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wvkwxeg6lh");
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
          <TrackingProvider>
            <PWAWrapper />
            <Navbar />
            {children}
          </TrackingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
