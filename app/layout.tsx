import type React from "react"
import type { Metadata, Viewport } from "next"
import "@radix-ui/themes/styles.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "Vini AI - Assistente Inteligente",
  description:
    "Assistente de IA avançado com interface elegante, reconhecimento de voz e recursos de streaming em tempo real. Converse por texto ou voz, faça upload de arquivos e obtenha respostas inteligentes.",
  keywords: ["IA", "Assistente Virtual", "Chat", "Reconhecimento de Voz", "Inteligência Artificial", "Vini AI"],
  authors: [{ name: "Vini AI Team" }],
  creator: "Vini AI",
  publisher: "Vini AI",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: [
    {
      url: "/favicon.ico",
      sizes: "16x16 32x32 48x48",
      type: "image/x-icon",
    },
    {
      url: "/favicon.svg",
      type: "image/svg+xml",
    },
    {
      url: "/icon.svg",
      type: "image/svg+xml",
    },
    {
      url: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vini AI",
    startupImage: "/icon-512.png",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    siteName: "Vini AI",
    title: "Vini AI - Assistente Inteligente",
    description:
      "Assistente de IA avançado com interface elegante, reconhecimento de voz e recursos de streaming em tempo real",
    url: "https://viniai.netlify.app",
    images: [
      {
        url: "https://viniai.netlify.app/icon-512.png",
        width: 512,
        height: 512,
        alt: "Vini AI Logo",
      },
    ],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vini AI - Assistente Inteligente",
    description:
      "Assistente de IA avançado com interface elegante, reconhecimento de voz e recursos de streaming em tempo real",
    images: ["https://viniai.netlify.app/icon-512.png"],
    creator: "@viniai",
  },
  alternates: {
    canonical: "https://viniai.netlify.app",
  },
  category: "technology",
  generator: "v0.dev",
}

export const viewport: Viewport = {
  themeColor: "#667eea",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Favicon - Multiple formats for better compatibility */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vini AI" />
        <meta name="application-name" content="Vini AI" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* Additional SEO */}
        <meta name="google" content="notranslate" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="format-detection" content="address=no" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-black font-modern">{children}</body>
    </html>
  )
}
