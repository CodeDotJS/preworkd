import type React from "react"
import type { Metadata } from "next"
import { Inter, Inconsolata } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const inconsolata = Inconsolata({
  subsets: ["latin"],
  variable: "--font-inconsolata",
})

export const metadata: Metadata = {
  title: "preworkd",
  description: "Fixing your data mistakes—gently mocking them along the way.",
    icons: {
      icon: '/goat.svg',
    }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inconsolata.variable} font-inter antialiased`}>{children}</body>
    </html>
  )
}
