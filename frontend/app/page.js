'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';

export default function RoleSelectPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // สลับบทบาทแล้วต้องล็อกอินใหม่ทุกครั้ง: เปลี่ยนไปผู้ขาย = ออกจากบัญชีเดิมก่อน
  const goBuyer = () => {
    if (user) logout();
    router.push('/login');
  };
  const goSeller = () => {
    if (user) logout();
    router.push('/login?role=seller');
  };

  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-12">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full border border-brand-pinkAccent/40 bg-brand-pinkSoft px-3 py-1 text-xs uppercase tracking-widest text-brand-pinkDark">
          Online Dress Rental
        </span>
        <h1 className="font-brand text-4xl font-bold sm:text-5xl">She wear it well</h1>
        <p className="mt-3 text-sm font-light text-gray-500">กรุณาเลือกว่าคุณจะเข้าใช้งานในฐานะอะไร</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={goBuyer}
          className="group rounded-3xl border-2 border-gray-100 bg-white p-6 text-left shadow-lg transition hover:-translate-y-1 hover:border-brand-pinkAccent"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pinkSoft text-3xl">🛍️</span>
          <h2 className="text-xl font-bold">ผู้ซื้อ (ลูกค้า)</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">เลือกชุด เช็กวันว่าง ใส่ตะกร้า ชำระเงินผ่าน QR และแนบสลิป</p>
          <span className="mt-4 inline-block text-xs font-semibold text-brand-pinkDark">ล็อกอินเพื่อเข้าหน้าร้าน →</span>
        </button>

        <button
          onClick={goSeller}
          className="group rounded-3xl border-2 border-gray-100 bg-white p-6 text-left shadow-lg transition hover:-translate-y-1 hover:border-brand-pinkAccent"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-black text-3xl">🏪</span>
          <h2 className="text-xl font-bold">ผู้ขาย (เจ้าของร้าน)</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">เพิ่มสินค้า ดูออเดอร์และสลิป อัปเดตสถานะจัดส่ง</p>
          <span className="mt-4 inline-block text-xs font-semibold text-brand-pinkDark">ล็อกอินเพื่อเข้าหลังบ้าน →</span>
        </button>
      </div>
    </div>
  );
}
