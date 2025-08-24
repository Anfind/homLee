import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AutoSyncInitializer } from '@/components/auto-sync-initializer'

export const metadata: Metadata = {
  title: 'Hệ thống điểm danh Lee Homes',
  description: 'Hệ thống chấm công thông minh với ZKTeco integration cho Lee Homes',
  generator: 'Next.js',
  icons: {
    icon: '/logo_leeHomes.webp',
    apple: '/logo_leeHomes.webp',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body suppressHydrationWarning>
        <AutoSyncInitializer />
        {children}
      </body>
    </html>
  )
}
