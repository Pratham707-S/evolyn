import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme/theme-context';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-[#F7F5F0] text-[#25251F] selection:bg-[#68745D] selection:text-white min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
