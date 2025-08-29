import type {Metadata} from 'next';
import {Toaster} from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Dashboard for the Bin Reminder service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-sans antialiased h-full bg-background text-foreground')} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
