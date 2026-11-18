'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CATEGORIES, api } from '@/lib/api';
import { useToast } from '@/components/Providers';
import RequireRole from '@/components/RequireRole';

const EMPTY = { name: '', category: 'set', size: '', measurements: '', description: '', shop_price: '' };

function ProductForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [tiers, setTiers] = useState([{ days: 1, price: '' }, { days: 2, price: '' }, { days: 3, price: '' }]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    api(`/api/products/${id}`)
      .then(({ product: p }) => {
        setF({
          name: p.name, category: p.category, size: p.size, measurements: p.measurements,
          description: p.description, shop_price: p.shop_price,
        });
        setTiers(p.tiers);
        setPreview(p.image);
      })
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setTier = (i, k, v) => setTiers(tiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)));

  const pickFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData();
      Object.entries(f).forEach(([k, v]) => form.append(k, v));
      form.append('tiers', JSON.stringify(tiers.map((t) => ({ days: Number(t.days), price: Number(t.price) }))));
      if (file) form.append('image', file);
      else if (imageUrl.trim()) form.append('image_url', imageUrl.trim());
      await api(isNew ? '/api/products' : `/api/products/${id}`, { method: isNew ? 'POST' : 'PUT', form });
      toast(isNew ? 'เพิ่มสินค้าสำเร็จ ✨' : 'บันทึกสินค้าแล้ว', 'success');
      router.push('/seller');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-20 text-center text-sm text-gray-500">กำลังโหลด...</p>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isNew ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</h1>
        <Link href="/seller" className="text-xs text-gray-500 underline">← กลับหลังบ้าน</Link>
      </div>

      <div className="card grid gap-5 p-5 sm:grid-cols-3">
        <div>
          <label className="label">รูปสินค้า</label>
          <label className="block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-brand-pinkAccent bg-brand-pinkLight/40 text-center hover:bg-brand-pinkLight">
            <input type="file" accept="image/*" className="hidden" onChange={pickFile} />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center p-3 text-xs text-gray-500">คลิกเพื่ออัปโหลดรูป</div>
            )}
          </label>
          <input className="input mt-2 !text-xs" placeholder="หรือวางลิงก์รูป (https://...)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>

        <div className="space-y-4 sm:col-span-2">
          <div>
            <label className="label">ชื่อสินค้า *</label>
            <input className="input" required value={f.name} onChange={set('name')} placeholder="เช่น Velvet Ribbon Rose Set (ชุดเซตโบว์ชมพู)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">หมวดหมู่ *</label>
              <select className="input" value={f.category} onChange={set('category')}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ไซส์</label>
              <input className="input" value={f.size} onChange={set('size')} placeholder="S / M" />
            </div>
          </div>
          <div>
            <label className="label">สัดส่วน (อก/เอว/สะโพก/ความยาว)</label>
            <input className="input" value={f.measurements} onChange={set('measurements')} />
          </div>
          <div>
            <label className="label">รายละเอียด</label>
            <textarea className="input" rows={3} value={f.description} onChange={set('description')} />
          </div>
          <div>
            <label className="label">ราคาป้ายจากช้อป (THB)</label>
            <input className="input" type="number" min="0" value={f.shop_price} onChange={set('shop_price')} />
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">ราคาเช่า (แพ็กเกจตามจำนวนวัน) *</p>
          <button type="button" className="btn btn-soft !py-1.5 !text-xs" onClick={() => setTiers([...tiers, { days: tiers.length + 1, price: '' }])}>
            + เพิ่มแพ็กเกจ
          </button>
        </div>
        {tiers.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="input !w-24" type="number" min="1" required value={t.days} onChange={(e) => setTier(i, 'days', e.target.value)} />
            <span className="text-xs text-gray-500">วัน</span>
            <input className="input" type="number" min="1" required placeholder="ราคา (THB)" value={t.price} onChange={(e) => setTier(i, 'price', e.target.value)} />
            {tiers.length > 1 && (
              <button type="button" className="text-xs text-red-500" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>ลบ</button>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-dark w-full !py-3" disabled={busy}>{busy ? 'กำลังบันทึก...' : isNew ? 'เพิ่มสินค้า' : 'บันทึกการแก้ไข'}</button>
    </form>
  );
}

export default function ProductFormPage() {
  return (
    <RequireRole role="seller">
      <ProductForm />
    </RequireRole>
  );
}
