import type { Metadata } from 'next';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

