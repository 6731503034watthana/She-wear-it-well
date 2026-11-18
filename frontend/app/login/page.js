'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useToast } from '@/components/Providers';

function LoginForm() {
  const { login, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const isSeller = params.get('role') === 'seller';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      if (isSeller && user.role !== 'seller') {
        logout();
        toast('บัญชีนี้ไม่ใช่บัญชีผู้ขาย', 'error');
        return;
      }
      if (!isSeller && user.role === 'seller') {
        logout();
        toast('นี่คือบัญชีผู้ขาย กรุณาเลือก "ผู้ขาย" ที่หน้าแรกเพื่อเข้าสู่ระบบ', 'error');
        return;
      }
      toast(`ยินดีต้อนรับคุณ ${user.name} 💕`, 'success');
      router.push(next || (user.role === 'seller' ? '/seller' : '/shop'));
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
          <h1 className="font-brand text-3xl font-bold">{isSeller ? 'เข้าสู่ระบบผู้ขาย' : 'เข้าสู่ระบบ'}</h1>
          <p className="mt-1 text-xs text-gray-500">
            {isSeller ? 'สำหรับเจ้าของร้าน (ใช้บัญชีผู้ขายที่ตั้งไว้ในระบบ)' : 'สำหรับผู้ซื้อ (ลูกค้า)'}
          </p>
        </div>
        <div>
          <label className="label">อีเมล</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">รหัสผ่าน</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-dark w-full" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
        {isSeller ? (
          <p className="text-center text-xs text-gray-500">
            <Link href="/" className="underline">← กลับไปเลือกบทบาท</Link>
          </p>
        ) : (
          <p className="text-center text-xs text-gray-500">
            ยังไม่มีบัญชี? <Link href="/register" className="font-medium text-brand-pinkDark underline">สมัครสมาชิก</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
