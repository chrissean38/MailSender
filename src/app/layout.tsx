import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Link from 'next/link';
import { ToastProvider } from '@/components/ui/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MailSender',
  description: 'Mass email sending application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 px-6 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
                MailSender
              </Link>
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/campaigns" className="text-slate-600 transition hover:text-slate-900">
                  Campaigns
                </Link>
                <Link href="/contacts" className="text-slate-600 transition hover:text-slate-900">
                  Contacts
                </Link>
                <Link href="/templates" className="text-slate-600 transition hover:text-slate-900">
                  Templates
                </Link>
                <Link href="/analytics" className="text-slate-600 transition hover:text-slate-900">
                  Analytics
                </Link>
                <Link href="/suppression" className="text-slate-600 transition hover:text-slate-900">
                  Suppression
                </Link>
                <Link href="/ses" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-800">
                  SES Console
                </Link>
              </div>
            </div>
          </nav>
          <main className="mx-auto max-w-7xl px-6 py-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
