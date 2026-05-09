import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Construction ERP - Quản lý dự án xây dựng',
  description: 'Hệ thống quản lý dự án xây dựng (ERP)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#020617] text-slate-100 antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

