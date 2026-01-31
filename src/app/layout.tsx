import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReviewCRM | Reputation Management Pipeline',
  description: 'Manage your reputation management leads, campaigns, and sales pipeline for 2ndimpression.co',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-clay-100 text-clay-900 antialiased`}>
        <Sidebar />

        <main className="ml-60 min-h-screen">
          <div className="p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
