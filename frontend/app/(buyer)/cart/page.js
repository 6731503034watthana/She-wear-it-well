'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { addDays, api, money, thaiDate } from '@/lib/api';
import { promptPayPayload } from '@/lib/promptpay';
import { useAuth, useCart, useToast } from '@/components/Providers';

export default function CartPage() {
  const { user, authLoading } = useAuth();
  const { cart, removeFromCart, clearCart } = useCart();
  const toast = useToast();
  const router = useRouter();
  const [info, setInfo] = useState({ name: '', phone: '', address: '' });
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [promptpay, setPromptpay] = useState('');
  const [busy, setBusy] = useState(false);

  const total = cart.reduce((s, i) => s + i.price, 0);
  const [conflicts, setConflicts] = useState({}); // cart key -> ข้อความปัญหา

  // ตรวจกับเซิร์ฟเวอร์ทุกครั้งที่ตะกร้าเปลี่ยน: ชุดถูกเช่าไปแล้ว / ซ้อนกับรายการอื่นในตะกร้า
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = {};
      const booked = {};
      for (const id of [...new Set(cart.map((i) => i.product_id))]) {
        try {
          booked[id] = (await api(`/api/products/${id}`)).product.booked_dates;
        } catch {
          booked[id] = null; // สินค้าถูกลบ/ปิดการเช่า
        }
      }
      const seen = {};
      for (const item of cart) {
        const range = Array.from({ length: item.days }, (_, k) => addDays(item.start_date, k));
        if (booked[item.product_id] === null) found[item.key] = 'สินค้านี้ปิดการเช่าแล้ว';
        else if (range.some((d) => booked[item.product_id].includes(d))) found[item.key] = 'ชุดนี้ถูกเช่าไปแล้วในวันที่เลือก';
        else if (range.some((d) => (seen[item.product_id] || []).includes(d))) found[item.key] = 'วันที่ซ้อนกับรายการเดียวกันในตะกร้า';
        seen[item.product_id] = [...(seen[item.product_id] || []), ...range];
      }
      if (!cancelled) setConflicts(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [cart]);
  const hasConflict = cart.some((i) => conflicts[i.key]);

  useEffect(() => {
    api('/api/config').then((d) => setPromptpay(d.promptpay_id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setInfo({ name: user.name, phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const pickSlip = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('กรุณาอัปโหลดเป็นไฟล์รูปภาพเท่านั้น', 'error');
    setSlip(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const checkout = async () => {
    if (!user) return router.push('/login?next=/cart');
    if (!info.name || !info.phone || !info.address) return toast('กรุณากรอกข้อมูลจัดส่งให้ครบ', 'error');
    if (hasConflict) return toast('มีรายการในตะกร้าที่ไม่ว่างแล้ว กรุณาลบหรือเลือกวันใหม่', 'error');
    if (!slip) return toast('กรุณาแนบสลิปโอนเงินก่อนยืนยัน', 'error');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('slip', slip);
      form.append(
        'data',
        JSON.stringify({
          ...info,
          items: cart.map((i) => ({ product_id: i.product_id, days: i.days, start_date: i.start_date })),
        })
      );
      const { order } = await api('/api/orders', { method: 'POST', form });
      clearCart();
      toast(`จองสำเร็จ! ออเดอร์ ${order.code} ✨ ชุดที่คุณเลือกถูกเช่าแล้ว`, 'success');
      router.push('/shop');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) return null;
  if (user?.role === 'seller') return <p className="py-20 text-center text-sm text-gray-500">บัญชีผู้ขายไม่มีตะกร้า</p>;

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-semibold">ตะกร้าของคุณยังว่างอยู่ค่ะ</p>
        <p className="mt-1 text-xs text-gray-500">เลือกชุดสวยๆ ลงตะกร้าได้เลย</p>
        <Link href="/shop" className="btn btn-dark mt-4">ไปเลือกชมชุด</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <h1 className="text-xl font-bold">ตะกร้าเช่าชุดของคุณ</h1>
        {cart.map((item) => (
          <div key={item.key} className={`card flex gap-3 p-3 ${conflicts[item.key] ? '!border-red-300 !bg-red-50' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="h-24 w-[72px] shrink-0 rounded-xl bg-brand-pinkLight object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                <button onClick={() => removeFromCart(item.key)} className="text-xs text-gray-400 hover:text-red-500">ลบ</button>
              </div>
              <p className="mt-0.5 text-[11px] text-gray-500">ไซส์ {item.size} • เช่า {item.days} วัน</p>
              <p className="mt-0.5 text-[11px] font-medium text-brand-pinkDark">
                📅 {item.days === 1 ? thaiDate(item.start_date) : `${thaiDate(item.start_date)} - ${thaiDate(item.end_date)}`}
              </p>
              {conflicts[item.key] && <p className="mt-1 text-[11px] font-semibold text-red-600">⚠️ {conflicts[item.key]} — กรุณาลบรายการนี้แล้วเลือกวันใหม่</p>}
              <p className="mt-1 text-sm font-bold">{money(item.price)}</p>
            </div>
          </div>
        ))}

        <div className="card space-y-3 p-4">
          <p className="text-sm font-semibold">🚗 ข้อมูลจัดส่ง (ร้านขับรถส่งเอง)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">ชื่อผู้รับ</label>
              <input className="input" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            </div>
            <div>
              <label className="label">เบอร์โทร</label>
              <input className="input" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">ที่อยู่จัดส่ง (หอพัก / เลขห้อง / จุดนัดรับ)</label>
            <textarea className="input" rows={2} value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="card space-y-4 p-5">
          <div className="rounded-2xl border border-brand-pinkMedium bg-brand-pinkLight p-4 text-center">
            <p className="text-xs text-gray-600">ยอดที่ต้องโอนชำระ (ค่าส่งฟรี)</p>
            <p className="mt-1 text-3xl font-bold">{money(total)}</p>
          </div>

          {promptpay && (
            <div className="rounded-2xl border-2 border-brand-black p-4 text-center">
              <p className="-mx-4 -mt-4 mb-3 rounded-t-xl bg-[#003D6B] py-1.5 text-xs font-semibold tracking-wider text-white">
                THAI QR PAYMENT / PROMPTPAY
              </p>
              <div className="mx-auto w-fit rounded-xl border border-gray-200 bg-white p-2">
                <QRCodeSVG value={promptPayPayload(promptpay, total)} size={176} />
              </div>
              <p className="mt-2 text-xs font-semibold">พร้อมเพย์: {promptpay}</p>
              <p className="text-[11px] text-gray-500">สแกนแล้วยอดเงินจะถูกกรอกให้อัตโนมัติ</p>
            </div>
          )}

          <div>
            <label className="label">แนบสลิปโอนเงิน (จำเป็น) <span className="text-red-500">*</span></label>
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-brand-pinkAccent bg-brand-pinkLight/40 p-4 text-center hover:bg-brand-pinkLight">
              <input type="file" accept="image/*" className="hidden" onChange={pickSlip} />
              {slipPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="slip" className="mx-auto max-h-48 rounded-xl border border-gray-200 shadow" />
                  <p className="mt-2 text-[11px] font-medium text-green-600">แนบสลิปแล้ว (คลิกเพื่อเปลี่ยน)</p>
                </>
              ) : (
                <p className="py-4 text-xs font-medium">คลิกเพื่อเลือกรูปสลิปจากเครื่อง</p>
              )}
            </label>
          </div>

          <button className="btn btn-dark w-full !py-3.5" onClick={checkout} disabled={busy || hasConflict}>
            {busy ? 'กำลังบันทึก...' : user ? 'ยืนยันการแจ้งโอนเงินและจองชุด' : 'เข้าสู่ระบบเพื่อชำระเงิน'}
          </button>
        </div>
      </div>
    </div>
  );
}
