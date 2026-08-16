'use client';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRootLayout({ children }) {
  const pathname = usePathname();

  // Exclude standalone pages like /admin/login from sidebar layout
  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
