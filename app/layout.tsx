import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Theme } from "@radix-ui/themes"
import "@radix-ui/themes/styles.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vini AI - Assistente Inteligente",
  description: "Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.",
  keywords: ["AI", "Assistente", "Chat", "Inteligência Artificial", "Vini AI"],
  authors: [{ name: "Vini AI Team" }],
  creator: "Vini AI",
  publisher: "Vini AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://viniai.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vini AI - Assistente Inteligente",
    description: "Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.",
    url: "https://viniai.vercel.app",
    siteName: "Vini AI",
    images: [
      {
        url: "/metatag.png",
        width: 1200,
        height: 630,
        alt: "Vini AI - Assistente Inteligente",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vini AI - Assistente Inteligente",
    description: "Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.",
    images: ["/metatag.png"],
    creator: "@viniai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/favicon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vini AI",
  },
  applicationName: "Vini AI",
  category: "productivity",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-TileColor" content="#667eea" />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.png" type="image/png" sizes="180x180" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  })
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration);
                      
                      // Forçar ativação se houver SW waiting
                      if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                      }
                      
                      // Escutar por updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed') {
                              console.log('🔄 Nova versão SW disponível!');
                              if (navigator.serviceWorker.controller) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                              } else {
                                console.log('🎉 PWA instalada pela primeira vez!');
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed: ', registrationError);
                    });
                });
                
                // Escutar mensagens do SW
                navigator.serviceWorker.addEventListener('message', function(event) {
                  if (event.data && event.data.type === 'SW_ACTIVATED') {
                    console.log('🎉 PWA ativa!', event.data.version);
                  }
                });
                
                // Detectar quando PWA é instalada
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  console.log('🔄 Service Worker controller mudou - PWA ativa!');
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Theme appearance="dark">{children}</Theme>
      </body>
    </html>
  )
}
