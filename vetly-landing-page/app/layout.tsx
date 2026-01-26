import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'greek'] })

export const metadata: Metadata = {
  title: 'Vetly - Πλατφόρμα Υγείας Κατοικιδίων',
  description: 'Συνδέστε με κτηνιάτρους, διαχειριστείτε την υγεία του κατοικιδίου σας',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
