import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'
import { SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin', 'greek'] })

const description = 'Βρείτε κτηνιάτρους, κλείστε ραντεβού και διαχειριστείτε την υγεία του κατοικιδίου σας.'
// 1200x630, the size link previews expect.
const shareImage = { url: '/branding/vetly-share.png', width: 1200, height: 630, alt: 'Vetly: η φροντίδα του κατοικιδίου σου, οργανωμένη σε ένα μέρος' }

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
