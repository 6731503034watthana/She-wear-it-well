import { STATUS, money, thaiDate } from '@/lib/api';

export default function OrderCard({ order, children, showCustomer }) {
  const st = STATUS[order.status] || { label: order.status, cls: 'bg-gray-100' };
  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <div>
          <span className="rounded-full bg-brand-black px-2.5 py-0.5 text-xs font-bold text-brand-pinkMedium">{order.code}</span>
          <span className="ml-2 text-[11px] text-gray-400">{new Date(order.created_at).toLocaleString('th-TH')}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <div className="grid gap-4 text-xs sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          {showCustomer && (
            <>
              <p><strong>ลูกค้า:</strong> {order.customer.name} ({order.customer.phone})</p>
              <p><strong>ที่อยู่จัดส่ง:</strong> {order.customer.address}</p>
            </>
          )}
          <div className="mt-2 space-y-1 rounded-xl bg-brand-pinkLight/60 p-2.5">
            {order.items.map((it, i) => (
              <p key={i}>
                • {it.name} ({it.days} วัน: {thaiDate(it.start_date)}
                {it.days > 1 ? ` - ${thaiDate(it.end_date)}` : ''}) - <strong>{money(it.price)}</strong>
              </p>
            ))}
          </div>
          <p className="pt-1 text-sm font-bold text-brand-pinkDark">ยอดรวม: {money(order.total)}</p>
        </div>
        <div className="border-t border-gray-100 pt-2 text-center sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
          <p className="mb-1 text-[11px] text-gray-500">สลิปโอนเงิน</p>
          <a href={order.slip_image} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.slip_image} alt="slip" className="mx-auto max-h-32 rounded-lg border border-gray-200 shadow-sm" />
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
