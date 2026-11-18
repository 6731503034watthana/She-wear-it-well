'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { STATUS, addDays, api, categoryLabel, money, thaiDate, toISO } from '@/lib/api';
import { useToast } from '@/components/Providers';
import RequireRole from '@/components/RequireRole';
import OrderCard from '@/components/OrderCard';

const ACTION_LABEL = {
  confirmed: 'ตรวจสลิปแล้ว • ยืนยันออเดอร์',
  rejected: 'ปฏิเสธ (สลิปไม่ถูกต้อง)',
  shipping: 'เริ่มจัดส่ง',
  delivered: 'ส่งมอบแล้ว',
  returned: 'รับชุดคืนแล้ว',
};

function Stat({ label, value, cls = '' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  );
}

const ACTIVE = ['pending', 'confirmed', 'shipping'];

function TaskRow({ order, item, note, action, onAction }) {
  const st = STATUS[order.status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-3 last:border-0 sm:p-4">
      <div className="min-w-0 flex-1 text-xs">
        <p className="text-sm font-semibold">{item.name} <span className="font-normal text-gray-500">({item.days} วัน)</span></p>
        <p className="mt-0.5">👤 {order.customer.name} • 📞 {order.customer.phone}</p>
        <p className="text-gray-600">📍 {order.customer.address}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-black px-2 py-0.5 text-[10px] font-bold text-brand-pinkMedium">{order.code}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
          {note && <span className="font-medium text-red-600">{note}</span>}
        </p>
      </div>
      {action && (
        <button className="btn btn-dark !py-2 !text-xs" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}

function Section({ title, count, children, empty }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 bg-brand-pinkLight/60 px-4 py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-brand-pinkDark">{count}</span>
      </div>
      {count === 0 ? <p className="py-6 text-center text-xs text-gray-400">{empty}</p> : children}
    </div>
  );
}

/** รายการที่ต้องทำทุกเช้า: ส่งวันนี้ / รับคืน / เตรียมของพรุ่งนี้ */
function TodayPanel({ orders, onChange, goOrders }) {
  if (!orders) return <p className="py-10 text-center text-sm text-gray-500">กำลังโหลด...</p>;
  const today = toISO(new Date());
  const tomorrow = addDays(today, 1);

  const rows = (fn) => orders.flatMap((o) => o.items.filter((it) => fn(o, it)).map((it) => ({ o, it })));
  const deliver = rows((o, it) => ACTIVE.includes(o.status) && it.start_date === today);
  const pickup = rows((o, it) => o.status === 'delivered' && it.end_date <= today);
  const prepare = rows((o, it) => ['pending', 'confirmed'].includes(o.status) && it.start_date === tomorrow);
  const pendingSlips = orders.filter((o) => o.status === 'pending').length;
  const nextOf = (o) => o.next_status.find((s) => s !== 'rejected');
  const deliverLabel = { pending: 'ยืนยันออเดอร์', confirmed: 'เริ่มจัดส่ง', shipping: 'ส่งมอบแล้ว' };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-brand-black p-4 text-white">
        <p className="text-xs text-brand-pinkMedium">สวัสดีตอนเช้าค่ะ ☀️</p>
        <p className="text-lg font-semibold">รายการของวันนี้ • {thaiDate(today)}</p>
        {pendingSlips > 0 && (
          <button onClick={goOrders} className="mt-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-brand-black">
            มี {pendingSlips} ออเดอร์รอตรวจสลิป →
          </button>
        )}
      </div>

      <Section title="🚗 ต้องส่งชุดวันนี้" count={deliver.length} empty="วันนี้ไม่มีชุดที่ต้องส่ง">
        {deliver.map(({ o, it }, i) => (
          <TaskRow
            key={`d${o.id}-${i}`} order={o} item={it}
            action={deliverLabel[o.status]}
            onAction={() => onChange(o.id, nextOf(o))}
          />
        ))}
      </Section>

      <Section title="📦 ต้องไปรับชุดคืน" count={pickup.length} empty="ไม่มีชุดที่ต้องรับคืน">
        {pickup.map(({ o, it }, i) => (
          <TaskRow
            key={`p${o.id}-${i}`} order={o} item={it}
            note={it.end_date < today ? `เกินกำหนด (ครบ ${thaiDate(it.end_date)})` : 'ครบกำหนดวันนี้'}
            action="รับชุดคืนแล้ว"
            onAction={() => onChange(o.id, 'returned')}
          />
        ))}
      </Section>

      <Section title="🧺 เตรียมของส่งพรุ่งนี้" count={prepare.length} empty="พรุ่งนี้ยังไม่มีคิวส่ง">
        {prepare.map(({ o, it }, i) => <TaskRow key={`n${o.id}-${i}`} order={o} item={it} />)}
      </Section>
    </div>
  );
}

function Dashboard() {
  const toast = useToast();
  const [tab, setTab] = useState('today');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, o, p] = await Promise.all([
        api('/api/seller/stats'),
        api('/api/orders'),
        api('/api/products?all=1'),
      ]);
      setStats(s);
      setOrders(o.orders);
      setProducts(p.products);
    } catch (e) {
      toast(e.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await api(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } });
      toast('อัปเดตสถานะแล้ว', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const toggle = async (p) => {
    try {
      await api(`/api/products/${p.id}/active`, { method: 'PATCH', body: { active: !p.active } });
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (p) => {
    if (!confirm(`ลบ "${p.name}" ออกจากระบบถาวร?\n\nข้อมูลสินค้า รูป และประวัติออเดอร์ที่เกี่ยวกับสินค้านี้จะถูกลบทั้งหมด และกู้คืนไม่ได้\n(ถ้าแค่ไม่อยากให้เช่าชั่วคราว ให้กด "เปิดให้เช่า" เพื่อปิดแทน)`)) return;
    try {
      const d = await api(`/api/products/${p.id}`, { method: 'DELETE' });
      toast('ลบสินค้าออกจากระบบแล้ว', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const tabCls = (on) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${on ? 'bg-brand-black text-brand-pinkMedium' : 'border border-gray-200 bg-white hover:bg-brand-pinkSoft'}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">หลังบ้านผู้ขาย</h1>
        <Link href="/seller/products/new" className="btn btn-dark">+ เพิ่มสินค้า</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="ออเดอร์ทั้งหมด" value={stats?.orders ?? '-'} />
        <Stat label="รอตรวจสลิป" value={stats?.pending ?? '-'} cls="text-amber-600" />
        <Stat label="สินค้าทั้งหมด" value={stats?.products ?? '-'} />
        <Stat label="รายได้รวม" value={stats ? money(stats.revenue) : '-'} cls="text-brand-pinkDark" />
      </div>

      <div className="flex gap-2">
        <button className={tabCls(tab === 'today')} onClick={() => setTab('today')}>☀️ งานวันนี้</button>
        <button className={tabCls(tab === 'orders')} onClick={() => setTab('orders')}>ออเดอร์ ({orders?.length ?? 0})</button>
        <button className={tabCls(tab === 'products')} onClick={() => setTab('products')}>สินค้า ({products?.length ?? 0})</button>
      </div>

      {tab === 'today' && <TodayPanel orders={orders} onChange={changeStatus} goOrders={() => setTab('orders')} />}

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders?.length === 0 && <p className="card py-14 text-center text-sm text-gray-500">ยังไม่มีออเดอร์</p>}
          {orders?.map((o) => (
            <OrderCard key={o.id} order={o} showCustomer>
              {o.next_status.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2">
                  {o.next_status.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(o.id, s)}
                      className={`btn !py-2 !text-xs ${s === 'rejected' ? 'btn-outline text-red-600' : 'btn-dark'}`}
                    >
                      {ACTION_LABEL[s] || STATUS[s]?.label}
                    </button>
                  ))}
                </div>
              )}
            </OrderCard>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="card divide-y divide-gray-100">
          {products?.length === 0 && <p className="py-14 text-center text-sm text-gray-500">ยังไม่มีสินค้า กด "+ เพิ่มสินค้า" ได้เลย</p>}
          {products?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image || 'https://placehold.co/200x260/FCE7F3/111111?text=SWIW'} alt="" className="h-16 w-12 shrink-0 rounded-lg bg-brand-pinkLight object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-gray-500">
                  {categoryLabel(p.category)} • ไซส์ {p.size || '-'} • เช่าเริ่มต้น {money(p.min_price)}/วัน
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <button
                  onClick={() => toggle(p)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                >
                  {p.active ? 'เปิดให้เช่า' : 'ปิดอยู่'}
                </button>
                <Link href={`/seller/products/${p.id}`} className="btn btn-outline !px-3 !py-1.5 !text-[11px]">แก้ไข</Link>
                <button onClick={() => remove(p)} className="btn btn-outline !px-3 !py-1.5 !text-[11px] text-red-600">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerPage() {
  return (
    <RequireRole role="seller">
      <Dashboard />
    </RequireRole>
  );
}
