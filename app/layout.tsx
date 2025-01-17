import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Speed Test - Test Your Internet Connection',
  description: 'Measure your internet connection speed with download, upload, ping and jitter tests.',
  icons: {
    icon: [
      { url: '/icon.ico' },
      { url: '/icon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/icon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/icon.ico',
    apple: '/icon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.ico" />
        <link rel="shortcut icon" href="/icon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
