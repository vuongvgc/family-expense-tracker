import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FallingBlossoms } from '@/components/falling-blossoms';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Family Expense Tracker',
  description: 'Track and manage your family expenses together',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <FallingBlossoms />
        {children}
      </body>
    </html>
  );
}
