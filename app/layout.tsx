import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Footer } from "@/components/footer"
import { StructuredData } from "@/components/structured-data"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' 
    ? 'https://theplateyard.com' 
    : 'http://localhost:3000'),
  title: {
    default: "The Plate Yard - Official Hi-Temp Factory Seconds",
    template: "%s | The Plate Yard"
  },
  description:
    "USA-made Hi-Temp bumper plates with minor cosmetic blemishes at wholesale prices. Pre-order now, pay when ready.",
  keywords: [
    "bumper plates",
    "hi-temp plates", 
    "factory seconds",
    "wholesale bumper plates",
    "crossfit equipment",
    "gym equipment",
    "weightlifting plates",
    "rubber bumper plates",
    "USA made plates",
    "discount gym equipment"
  ],
  authors: [{ name: "The Plate Yard" }],
  creator: "The Plate Yard",
  publisher: "The Plate Yard",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://theplateyard.com',
  },
  generator: "Next.js",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "The Plate Yard - Official Hi-Temp Factory Seconds",
    description: "USA-made Hi-Temp bumper plates with minor cosmetic blemishes at wholesale prices. Pre-order now, pay when ready.",
    url: "https://theplateyard.com",
    siteName: "The Plate Yard",
    images: [
      {
        url: '/social-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'The Plate Yard - Hi-Temp Bumper Plates'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Plate Yard - Official Hi-Temp Factory Seconds", 
    description: "USA-made Hi-Temp bumper plates with minor cosmetic blemishes at wholesale prices. Pre-order now, pay when ready.",
    images: {
      url: '/social-preview.jpg',
      alt: 'The Plate Yard - Hi-Temp Bumper Plates',
    },
    creator: '@theplateyard', // Add your Twitter handle if you have one
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Explicit social meta tags for better compatibility */}
        <meta property="og:image" content="https://theplateyard.com/social-preview.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:image" content="https://theplateyard.com/social-preview.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <StructuredData />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
