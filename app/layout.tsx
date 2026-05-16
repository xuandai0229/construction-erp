import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import QueryProvider from './providers/QueryProvider';

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
    <html lang="vi">
      <body className="min-h-screen antialiased overflow-x-hidden">
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

