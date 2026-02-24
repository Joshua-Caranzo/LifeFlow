// app/layout.tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ThemeWrapper } from '@/components/ThemeWrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LifeFlow',
  description: 'A way of living a life that flows freely',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased min-h-screen bg-blue-50`}>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}