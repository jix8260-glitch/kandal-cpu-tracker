import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthLock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CPU (Central Production Unit) - Kandal Commissary Kitchen',
  description: 'Daily Stock & Cost Per Unit (CPU) Tracker for Kandal Commissary Kitchen (Tube Coffee & OnMart)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-['Inter',_'Kantumruy_Pro',_sans-serif] bg-slate-100 text-slate-800 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
            CPU (Central Production Unit) • Kandal Commissary Kitchen • Tube Coffee &amp; OnMart Operations
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
