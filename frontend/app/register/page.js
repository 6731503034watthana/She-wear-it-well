'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/components/Providers';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(f);
      toast('สมัครสมาชิกสำเร็จ 💕', 'success');
      router.push('/shop');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
        <div className="text-center">
          <h1 className="font-brand text-3xl font-bold">สมัครสมาชิก</h1>
          <p className="mt-1 text-xs text-gray-500">สำหรับผู้ซื้อ (ลูกค้า)</p>
        </div>
        <div>
          <label className="label">ชื่อเล่น *</label>
          <input className="input" required value={f.name} onChange={set('name')} placeholder="เช่น น้องมายด์" />
        </div>
        <div>
          <label className="label">อีเมล *</label>
          <input className="input" type="email" required value={f.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">เบอร์โทรศัพท์ *</label>
          <input className="input" type="tel" required value={f.phone} onChange={set('phone')} placeholder="089-xxx-xxxx" />
        </div>
        <div>
          <label className="label">ที่อยู่จัดส่งเริ่มต้น (หอพัก / เลขห้อง)</label>
          <textarea className="input" rows={2} value={f.address} onChange={set('address')} />
        </div>
        <div>
          <label className="label">รหัสผ่าน (อย่างน้อย 6 ตัว) *</label>
          <input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} />
        </div>
        <button className="btn btn-dark w-full" disabled={busy}>{busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        <p className="text-center text-xs text-gray-500">
          มีบัญชีแล้ว? <Link href="/login" className="font-medium text-brand-pinkDark underline">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </div>
  );
}
