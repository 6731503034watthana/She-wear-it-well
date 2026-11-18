'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useCart } from './Providers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const inSeller = pathname.startsWith('/seller');
  const bare = pathname === '/' || pathname === '/login' || pathname === '/register'; // หน้าเลือกบทบาท/ล็อกอิน: ไม่โชว์เมนู
  const buyerArea = !inSeller && !bare;

  const doLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-brand-pinkSoft bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-pinkAccent bg-brand-black font-brand text-lg font-bold text-brand-pinkMedium">
            S
          </span>
          <span>
            <span className="block font-brand text-lg font-bold leading-none sm:text-xl">She wear it well</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              {inSeller ? 'Seller Dashboard' : 'Fashion Rental Studio'}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {/* ฝั่งผู้ขาย: มีแค่ปุ่มออกจากระบบ */}
          {inSeller && user && (
            <button onClick={doLogout} className="btn btn-outline !px-3 !py-1.5 !text-xs">ออกจากระบบ</button>
          )}

          {/* ฝั่งผู้ซื้อ */}
          {buyerArea && (
            <>
              <Link href="/shop" className="btn btn-outline !px-3 !py-1.5 !text-xs">ร้านค้า</Link>
              {user?.role === 'buyer' && (
                <Link href="/orders" className="btn btn-outline !px-3 !py-1.5 !text-xs">ออเดอร์ของฉัน</Link>
              )}
              {user?.role !== 'seller' && (
                <Link href="/cart" className="btn btn-dark !px-3 !py-1.5 !text-xs">
                  ตะกร้า
                  <span className="rounded-full bg-brand-pinkAccent px-1.5 text-[11px] font-bold text-brand-black">{cart.length}</span>
                </Link>
              )}
              {!user && <Link href="/login" className="btn btn-dark !px-3 !py-1.5 !text-xs">เข้าสู่ระบบ</Link>}
              {user && (
                <button onClick={doLogout} className="btn btn-outline !px-3 !py-1.5 !text-xs" title={user.email}>
                  ออก ({user.name.split(' ')[0]})
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
