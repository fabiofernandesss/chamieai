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
  metadataBase: new URL("https://viniai.netlify.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vini AI - Assistente Inteligente",
    description: "Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.",
    url: "https://viniai.netlify.app",
    siteName: "Vini AI",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Vini AI Logo",
      },
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Vini AI Logo SVG",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vini AI - Assistente Inteligente",
    description: "Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.",
    images: ["/icon-512.png"],
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
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
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
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
      </head>
      <body className={inter.className}>
        <Theme appearance="dark">{children}</Theme>
      </body>
    </html>
  )
}
