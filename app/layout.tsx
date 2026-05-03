import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './components/auth/AuthProvider';

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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
