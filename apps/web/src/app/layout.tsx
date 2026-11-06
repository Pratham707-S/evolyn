import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { AppProviders } from '@/providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Evolyn — AI-Powered Brand Governance Platform',
  description: 'Grounded brand governance, claim verification, and continuous guideline improvement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="antialiased font-sans bg-[#F7F5F0] text-[#25251F] selection:bg-[#68745D] selection:text-white min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
