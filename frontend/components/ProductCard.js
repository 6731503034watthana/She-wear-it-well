import Link from 'next/link';
import { categoryLabel, money, thaiDate } from '@/lib/api';

export default function ProductCard({ p }) {
  return (
    <Link
      href={`/product/${p.id}`}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-brand-pinkAccent hover:shadow-xl"
    >
      <div>
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-pinkLight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image || 'https://placehold.co/600x800/FCE7F3/111111?text=She+wear+it+well'}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-brand-black/80 px-2.5 py-1 text-[10px] font-medium text-white">
            {categoryLabel(p.category)}
          </span>
          <span className="absolute right-2.5 top-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold shadow-sm">{p.size}</span>
          {p.next_booked && p.active && (
            <div className="absolute inset-x-2 bottom-2 rounded-lg bg-red-600/95 px-2 py-1.5 text-center text-white shadow">
              <p className="text-[11px] font-bold">{p.rented_now ? 'กำลังถูกเช่า' : 'ถูกเช่าแล้ว'}</p>
              <p className="text-[10px] opacity-90">
                {p.rented_now ? 'วันนี้' : `คิวถัดไป ${thaiDate(p.next_booked)}`} • ติดจอง {p.booked_days} วัน
              </p>
            </div>
          )}
          {!p.active && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] text-white">ปิดการเช่า</span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h4 className="line-clamp-1 text-xs font-semibold group-hover:text-brand-pinkDark sm:text-sm">{p.name}</h4>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{p.measurements}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-50 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        <div>
          <p className="text-[10px] text-gray-400">เช่าเริ่มต้น</p>
          <p className="text-sm font-bold text-brand-pinkDark sm:text-base">
            {money(p.min_price)} <span className="text-[10px] font-normal text-gray-500">/วัน</span>
          </p>
        </div>
        <span className="rounded-xl bg-brand-pinkSoft px-2.5 py-1.5 text-[11px] font-medium transition group-hover:bg-brand-black group-hover:text-brand-pinkMedium">
          เช็กวันว่าง
        </span>
      </div>
    </Link>
  );
}
