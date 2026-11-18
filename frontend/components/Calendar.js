'use client';
import { useState } from 'react';
import { addDays, toISO } from '@/lib/api';

const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** ปฏิทินเลือกวันเริ่มเช่า: ปิดวันที่ผ่านมาแล้ว / ติดจอง และไฮไลต์ช่วงที่เลือก */
export default function Calendar({ bookedDates, days, value, onChange }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const booked = new Set(bookedDates);
  const todayIso = toISO(new Date());
  const range = value ? Array.from({ length: days }, (_, i) => addDays(value, i)) : [];

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();

  const rangeFree = (start) => Array.from({ length: days }, (_, i) => addDays(start, i)).every((d) => !booked.has(d));

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= count; d++) {
    const iso = toISO(new Date(year, month, d));
    const past = iso < todayIso;
    const isBooked = booked.has(iso);
    const selected = range.includes(iso);
    let cls = 'rounded-lg py-2 text-xs font-medium transition ';
    if (past) cls += 'cursor-not-allowed bg-gray-50 text-gray-300';
    else if (isBooked) cls += 'cursor-not-allowed border border-red-200 bg-red-50 text-red-400 line-through';
    else if (selected) cls += 'bg-brand-pinkAccent font-bold text-brand-black ring-2 ring-brand-black';
    else cls += 'border border-gray-100 bg-white hover:bg-brand-pinkSoft';
    cells.push(
      <button
        key={iso}
        type="button"
        disabled={past || isBooked}
        className={cls}
        onClick={() => onChange(iso, rangeFree(iso))}
      >
        {d}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className="btn btn-outline !px-2.5 !py-1" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <span className="text-sm font-medium">{MONTHS[month]} {year + 543}</span>
        <button type="button" className="btn btn-outline !px-2.5 !py-1" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 px-3 py-1.5 text-[11px]">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-gray-300 bg-white" /> ว่าง</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand-pinkAccent" /> วันที่คุณเลือก</span>
        <span className="flex items-center gap-1.5 text-red-500"><i className="h-2.5 w-2.5 rounded-full border border-red-300 bg-red-100" /> ถูกเช่าแล้ว</span>
      </div>
      <div className="rounded-2xl border border-gray-200 p-3">
        <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-medium text-gray-400">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">{cells}</div>
      </div>
    </div>
  );
}
