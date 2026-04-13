import type { Metadata } from "next"
import { Bebas_Neue, DM_Sans } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import CustomCursor from "@/components/CustomCursor"
import { MessageCircleIcon } from "lucide-react"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://vrz.lb"),
  title: {
    default: "VRZ — VR Hunting Lounge | Byblos, Lebanon",
    template: "%s | VRZ Byblos",
  },
  description:
    "Book your VR hunting session at VRZ in Byblos, Lebanon. 6 immersive machines. Open 3PM–11PM. Single sessions and private full-space rentals available.",
  keywords: [
    "VR Byblos",
    "virtual reality Lebanon",
    "VR hunting",
    "VRZ",
    "Jbeil VR",
    "book VR Lebanon",
    "VR gaming Byblos",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VRZ",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "VRZ",
  description:
    "VR Hunting Lounge in Byblos, Lebanon. 6 immersive VR stations available for single sessions and private full-space rentals.",
  url: "https://vrz.lb",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Byblos",
    addressRegion: "North Lebanon",
    addressCountry: "LB",
  },
  openingHours: "Mo-Su 15:00-23:00",
  priceRange: "$$",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${bebasNeue.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CustomCursor />
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />

        {/* Floating WhatsApp button */}
        <a
          href="https://wa.me/96170000000"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-105"
        >
          <MessageCircleIcon className="size-6" />
        </a>
      </body>
    </html>
  )
}
