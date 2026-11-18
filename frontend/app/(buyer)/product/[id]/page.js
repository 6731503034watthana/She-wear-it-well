'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { addDays, api, categoryLabel, money, thaiDate } from '@/lib/api';
import { useAuth, useCart, useToast } from '@/components/Providers';
import Calendar from '@/components/Calendar';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { cart, addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [tierIdx, setTierIdx] = useState(0);
  const [start, setStart] = useState(null);

  useEffect(() => {
    api(`/api/products/${id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="py-20 text-center text-sm text-red-500">{error}</p>;
  if (!product) return <p className="py-20 text-center text-sm text-gray-500">กำลังโหลด...</p>;

  // วันที่ถูกเช่าแล้ว + วันที่ชุดนี้อยู่ในตะกร้าของเราเองแล้ว (กันเลือกซ้อนกัน)
  const inCart = cart
    .filter((c) => c.product_id === product.id)
    .flatMap((c) => Array.from({ length: c.days }, (_, k) => addDays(c.start_date, k)));
  const unavailable = [...product.booked_dates, ...inCart];

  const tier = product.tiers[tierIdx];
  const end = start ? addDays(start, tier.days - 1) : null;
  const isSeller = user?.role === 'seller';

  const pickTier = (i) => {
    setTierIdx(i);
    if (start) {
      const free = Array.from({ length: product.tiers[i].days }, (_, k) => addDays(start, k)).every(
        (d) => !unavailable.includes(d)
      );
      if (!free) {
        setStart(null);
        toast('จำนวนวันที่เลือกชนกับคิวที่ถูกเช่าแล้ว กรุณาเลือกวันเริ่มใหม่', 'error');
      }
    }
  };

  const onPickDate = (iso, free) => {
    if (!free) return toast(`เช่า ${tier.days} วันเริ่มวันนี้ไม่ได้ เพราะติดคิวเช่าวันถัดไป`, 'error');
    setStart(iso);
  };

  const add = (goAccessories) => {
    if (!start) return toast('กรุณาเลือกวันเริ่มเช่าในปฏิทินก่อน 📅', 'error');
    addToCart({
      product_id: product.id,
      name: product.name,
      image: product.image,
      size: product.size,
      days: tier.days,
      price: tier.price,
      start_date: start,
      end_date: end,
    });
    toast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว 🛍️`, 'success');
    router.push(goAccessories ? '/shop?cat=accessories' : '/shop');
  };

  return (
    <div className="grid gap-8 md:grid-cols-12">
      <div className="space-y-3 md:col-span-5">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-brand-pinkSoft bg-brand-pinkLight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || 'https://placehold.co/600x800/FCE7F3/111111?text=She+wear+it+well'}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/15 bg-brand-black/85 p-2.5 text-white backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-brand-pinkMedium">ราคาป้ายจากช้อป</p>
            <p className="text-sm font-semibold">{money(product.shop_price)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-pinkMedium bg-brand-pinkLight/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">📏 ไซส์และสัดส่วนชุด</span>
            <span className="rounded-md bg-brand-black px-2 py-0.5 text-xs font-bold text-white">{product.size || '-'}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{product.measurements || '-'}</p>
        </div>
      </div>

      <div className="space-y-5 md:col-span-7">
        <div>
          <span className="rounded-full bg-brand-pinkAccent px-2.5 py-0.5 text-[11px] font-semibold">{categoryLabel(product.category)}</span>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">{product.name}</h1>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{product.description}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold">1. เลือกจำนวนวันที่ต้องการเช่า</p>
          <div className="grid grid-cols-3 gap-2">
            {product.tiers.map((t, i) => (
              <button
                key={t.days}
                onClick={() => pickTier(i)}
                className={`rounded-xl border p-2.5 text-center transition ${
                  i === tierIdx ? 'border-brand-black bg-brand-black text-white shadow-md' : 'border-brand-pinkMedium bg-brand-pinkLight/50 hover:bg-brand-pinkSoft'
                }`}
              >
                <p className={`text-xs font-medium ${i === tierIdx ? 'text-brand-pinkMedium' : 'text-gray-600'}`}>
                  {t.days} {t.days === 1 ? 'Day' : 'Days'}
                </p>
                <p className="mt-0.5 text-sm font-bold sm:text-base">{money(t.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold">2. เลือกวันเริ่มเช่า (เช็กวันว่าง/ติดจอง)</p>
          <Calendar bookedDates={unavailable}days={tier.days} value={start} onChange={onPickDate} />
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between rounded-xl border border-brand-pinkMedium bg-brand-pinkLight p-3 text-xs">
            {start ? (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-brand-pinkDark">วันที่เช่า ({tier.days} วัน)</p>
                  <p className="font-bold">{tier.days === 1 ? thaiDate(start) : `${thaiDate(start)} - ${thaiDate(end)}`}</p>
                </div>
                <p className="text-base font-bold text-brand-pinkDark">{money(tier.price)}</p>
              </>
            ) : (
              <>
                <span className="text-gray-600">กรุณาเลือกวันเริ่มเช่าในปฏิทิน</span>
                <span className="font-bold">{money(tier.price)}</span>
              </>
            )}
          </div>
          {isSeller ? (
            <p className="text-center text-xs text-gray-500">บัญชีผู้ขายไม่สามารถเช่าสินค้าได้</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button className="btn btn-dark" onClick={() => add(false)}>🛍️ เพิ่มลงตะกร้า</button>
              <button className="btn btn-soft border border-brand-pinkAccent/40" onClick={() => add(true)}>✨ เพิ่ม & เลือกแอคเซสเซอรี่</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
