import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
