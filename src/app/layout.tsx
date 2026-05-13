import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'King AI Coach — Elite Transformation Coaching',
  description: 'AI-powered fitness transformation. Build your elite physique with personalized coaching.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'King AI Coach',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',       // honour iPhone notch / home-indicator safe areas
  themeColor: '#080808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased w-full overflow-x-hidden`}>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              color: '#F5F5F5',
            },
          }}
        />
      </body>
    </html>
  )
}
