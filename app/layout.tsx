import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Navigation from '@/components/Navigation'

const iranSans = localFont({
  src: [
    {
      path: '../public/fonts/IRANSansXV.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansXV.woff',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-iransans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'فروشگاه حیوانات خانگی',
  description: 'فروشگاه آنلاین حیوانات خانگی',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" className={iranSans.variable}>
      <body className="font-sans antialiased">
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}

