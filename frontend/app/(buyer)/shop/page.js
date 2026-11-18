'use client';
import { useEffect, useState } from 'react';
import { api, CATEGORIES } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get('cat');
    if (cat) setCategory(cat);
  }, []);

  useEffect(() => {
    setProducts(null);
    api(`/api/products?category=${category}`)
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));
  }, [category]);

  return (
    <div>
      <section className="mb-6 rounded-3xl bg-gradient-to-r from-brand-black via-brand-charcoal to-brand-black px-6 py-7 text-white">
        <span className="mb-2 inline-block rounded-full border border-brand-pinkAccent/30 bg-brand-pinkAccent/20 px-2.5 py-0.5 text-[11px] text-brand-pinkMedium">
          ✨ เช่าสวยแบบไม่ต้องซื้อซ้ำ
        </span>
        <h1 className="text-xl font-semibold sm:text-2xl">
          เลือกแมตช์ลุคโปรดของคุณ <span className="font-brand italic text-brand-pinkMedium">She wear it well</span>
        </h1>
        <p className="mt-1 text-xs font-light text-gray-300 sm:text-sm">
          เช็กวันว่างได้ทันที เลือกชุด ท่อนบน-ล่าง แอคเซสเซอรี่และกระเป๋าในออเดอร์เดียว • ขับรถส่งถึงหน้าหอพัก 🚗
        </p>
      </section>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              category === c.id ? 'bg-brand-black text-brand-pinkMedium' : 'bg-brand-pinkLight/70 text-gray-700 hover:bg-brand-pinkSoft'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}
      {!error && products === null && <p className="py-10 text-center text-sm text-gray-500">กำลังโหลดสินค้า...</p>}
      {products && products.length === 0 && <p className="py-10 text-center text-sm text-gray-500">ยังไม่มีสินค้าในหมวดนี้</p>}
      {products && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
