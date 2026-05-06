import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import ClientWrapper from '../components/ClientWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Holy Moly Family",
  description: "Household and business finance tracker.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Ledger",
  },
};



export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents annoying zoom-ins when double-tapping
  viewportFit: 'cover', // This forces the app behind the Dynamic Island
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen w-full overflow-x-hidden`}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}