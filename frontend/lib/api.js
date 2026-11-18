export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getToken() {
  try {
    return localStorage.getItem('swiw_token');
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('swiw_token', token);
    else localStorage.removeItem('swiw_token');
  } catch {}
}

/** Fetch wrapper: sends token, parses JSON, throws Error(message) on failure. */
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form; // FormData: browser sets the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, cache: 'no-store' });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (ตรวจสอบว่ารัน backend แล้ว)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'เกิดข้อผิดพลาด');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'set', label: 'ชุดเป็นเซต' },
  { id: 'tops', label: 'ท่อนบน' },
  { id: 'bottoms', label: 'ท่อนล่าง' },
  { id: 'accessories', label: 'แอคเซสเซอรี่' },
  { id: 'bags', label: 'กระเป๋า' },
];

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

export const STATUS = {
  pending: { label: 'รอตรวจสลิป', cls: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'ยืนยันแล้ว', cls: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'กำลังจัดส่ง', cls: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'ส่งมอบแล้ว', cls: 'bg-green-100 text-green-700' },
  returned: { label: 'คืนชุดแล้ว', cls: 'bg-gray-200 text-gray-700' },
  rejected: { label: 'ปฏิเสธ', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'ยกเลิก', cls: 'bg-red-100 text-red-700' },
};

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export function thaiDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y + 543}`;
}

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + n));
}

export const money = (n) => `${Number(n).toLocaleString()} THB`;
