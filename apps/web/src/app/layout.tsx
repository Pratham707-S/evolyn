import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#F7F5F0',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://evolyn-nhbb.vercel.app'),
  title: {
    default: 'Evolyn — AI-Powered Brand Governance Platform',
    template: '%s | Evolyn',
  },
  description:
    'Grounded brand governance, deterministic claim verification, AI style auditing, and continuous guideline improvement.',
  keywords: [
    'brand governance',
    'AI compliance',
    'claim verification',
    'style guide auditing',
    'enterprise brand safety',
    'content integrity',
  ],
  authors: [{ name: 'Evolyn Team' }],
  creator: 'Evolyn',
  publisher: 'Evolyn',
  openGraph: {
    title: 'Evolyn — AI-Powered Brand Governance Platform',
    description:
      'Grounded brand governance, claim verification, and continuous guideline improvement.',
    url: 'https://evolyn-nhbb.vercel.app',
    siteName: 'Evolyn',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evolyn — AI-Powered Brand Governance Platform',
    description:
      'Grounded brand governance, claim verification, and continuous guideline improvement.',
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-[#F7F5F0] text-[#25251F] selection:bg-[#68745D] selection:text-white min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
