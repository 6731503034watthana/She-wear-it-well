'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Providers';
import RequireRole from '@/components/RequireRole';
import OrderCard from '@/components/OrderCard';

function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [fresh, setFresh] = useState('');

  const load = useCallback(() => {
    api('/api/orders').then((d) => setOrders(d.orders)).catch((e) => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    load();
    setFresh(new URLSearchParams(window.location.search).get('new') || '');
  }, [load]);

  const cancel = async (id) => {
    if (!confirm('ยืนยันยกเลิกออเดอร์นี้?')) return;
    try {
      await api(`/api/orders/${id}/cancel`, { method: 'POST' });
      toast('ยกเลิกออเดอร์แล้ว');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ออเดอร์ของฉัน</h1>
      {fresh && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✨ การเช่าสำเร็จ! ออเดอร์ <strong>{fresh}</strong> ทางร้านได้รับสลิปแล้ว กำลังรอตรวจสอบค่ะ
        </div>
      )}
      {orders === null && <p className="py-10 text-center text-sm text-gray-500">กำลังโหลด...</p>}
      {orders?.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-500">
          ยังไม่มีออเดอร์ <Link href="/shop" className="font-medium text-brand-pinkDark underline">ไปเลือกชุด</Link>
        </div>
      )}
      {orders?.map((o) => (
        <OrderCard key={o.id} order={o}>
          {o.status === 'pending' && (
            <div className="flex justify-end">
              <button className="btn btn-outline !py-1.5 !text-xs" onClick={() => cancel(o.id)}>ยกเลิกออเดอร์</button>
            </div>
          )}
        </OrderCard>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireRole role="buyer">
      <Orders />
    </RequireRole>
  );
}
