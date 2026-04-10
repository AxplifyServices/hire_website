import type {Metadata} from 'next';
import './globals.css';
import AgentationProvider from '@/components/dev/AgentationProvider';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hire-automotive.local'),
  title: {
    default: 'Hire Automotive Group',
    template: '%s | Hire Automotive Group'
  },
  description: 'Front-end Next.js multilingue branché uniquement sur les APIs déjà exposées du back-end NestJS.',
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {children}
        <AgentationProvider />
      </body>
    </html>
  );
}