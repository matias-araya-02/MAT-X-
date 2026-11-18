import { Jura } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: {
    default: 'MAT-X | Periféricos Gaming',
    template: '%s | MAT-X',
  },
  description: 'Teclados, auriculares, cables y controladoras para gamers. Estética violeta, calidad PRO.',
  keywords: ['teclados mecánicos', 'auriculares gaming', 'cables coiled', 'controladoras PC', 'periféricos gaming'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://mat-x.vercel.app',
    siteName: 'MAT-X',
  },
}

const jura = Jura({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jura',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={jura.variable}>
      <body className="bg-background text-text font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
