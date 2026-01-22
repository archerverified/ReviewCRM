import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReviewCRM - 2ndImpression',
  description: 'Business management CRM for Google review removal services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-clay-50 text-clay-900 antialiased`}>
        <div className="min-h-screen">
          <nav className="border-b border-clay-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center space-x-8">
                  <span className="text-xl font-semibold text-clay-900">ReviewCRM</span>
                  <div className="flex items-center space-x-6">
                    <a href="/" className="text-sm font-medium text-clay-600 hover:text-clay-900 transition-colors">
                      Businesses
                    </a>
                    <a href="/campaigns" className="text-sm font-medium text-clay-600 hover:text-clay-900 transition-colors">
                      Campaigns
                    </a>
                    <a href="/pipeline" className="text-sm font-medium text-clay-600 hover:text-clay-900 transition-colors">
                      Pipeline
                    </a>
                    <a href="/metrics" className="text-sm font-medium text-clay-600 hover:text-clay-900 transition-colors">
                      Metrics
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
