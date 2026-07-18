import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Application Email Sender',
  description: 'Send job application emails with CV attachment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
