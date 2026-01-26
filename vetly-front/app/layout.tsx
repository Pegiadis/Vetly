import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'greek'] })

export const metadata: Metadata = {
  title: 'Vetly - Είσοδος',
  description: 'Συνδεθείτε στο Vetly',
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
