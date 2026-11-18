'use client';
import RequireRole from '@/components/RequireRole';

// ทุกหน้าฝั่งผู้ซื้อ (ร้านค้า/สินค้า/ตะกร้า/ออเดอร์) ต้องล็อกอินเป็นผู้ซื้อก่อน
export default function BuyerLayout({ children }) {
  return <RequireRole role="buyer">{children}</RequireRole>;
}
