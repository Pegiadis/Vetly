import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'
import { SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin', 'greek'] })

const description = 'Βρείτε κτηνιάτρους, κλείστε ραντεβού και διαχειριστείτε την υγεία του κατοικιδίου σας.'
const shareImage = { url: '/branding/vetly-logo-transparent.png', width: 2109, height: 746, alt: 'Vetly' }

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vetly - Κτηνιατρική Φροντίδα',
    template: '%s | Vetly',
  },
  description,
  openGraph: {
    type: 'website',
    siteName: 'Vetly',
    locale: 'el_GR',
    title: 'Vetly - Κτηνιατρική Φροντίδα',
    description,
    images: [shareImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetly - Κτηνιατρική Φροντίδα',
    description,
    images: [shareImage.url],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el" className="scroll-smooth">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
