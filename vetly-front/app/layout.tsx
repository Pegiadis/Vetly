import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({ subsets: ['latin', 'greek'] })

export const metadata: Metadata = {
  title: {
    default: 'Vetly - Κτηνιατρική Φροντίδα',
    template: '%s | Vetly',
  },
  description: 'Βρείτε κτηνιάτρους, κλείστε ραντεβού και διαχειριστείτε την υγεία του κατοικιδίου σας.',
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
