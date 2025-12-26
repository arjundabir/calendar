import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import ConvexClientProvider from '@/components/convex/ConvexClientProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Calendar | Zotsites',
  description: 'Create your UCI Quarter Course Schedule here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-none">
      <body className={`${inter.variable} antialiased`}>
        <Toaster position="bottom-center" richColors />
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
