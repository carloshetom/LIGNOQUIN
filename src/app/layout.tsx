import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Lignoquim — Sistema de Ensayos de Eficacia',
  description: 'Plataforma de recolección de datos, tabulación y análisis estadístico para ensayos de eficacia de productos Lignoquim en cultivos del Perú.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen bg-lq-bg">
        <Navigation />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
