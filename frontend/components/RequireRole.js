'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './Providers';

/** บังคับให้ล็อกอินและมี role ที่ต้องการ ไม่เช่นนั้นเด้งไปหน้า login */
export default function RequireRole({ role, children }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(role === 'seller' ? '/login?role=seller' : `/login?next=${encodeURIComponent(pathname)}`);
    else if (role && user.role !== role) router.replace('/');
  }, [user, authLoading, role, router, pathname]);

  if (authLoading || !user || (role && user.role !== role)) {
    return <p className="py-20 text-center text-sm text-gray-500">กำลังโหลด...</p>;
  }
  return children;
}
