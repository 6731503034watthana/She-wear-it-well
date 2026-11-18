import Link from 'next/link';

export const metadata = { title: 'Contact us | She wear it well' };

const INSTAGRAM_URL = 'https://www.instagram.com/swiw.offi/';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-10">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full border border-brand-pinkAccent/40 bg-brand-pinkSoft px-3 py-1 text-xs uppercase tracking-widest text-brand-pinkDark">
          Contact us
        </span>
        <h1 className="font-brand text-4xl font-bold sm:text-5xl">She wear it well</h1>
      </div>

      <div className="card space-y-5 p-6 sm:p-8">
        <p className="leading-relaxed text-gray-700">
          She-wear-it-well is an online fashion rental platform designed to make stylish dressing affordable and
          sustainable. Instead of buying expensive outfits worn only once, customers can easily rent curated tops,
          bottoms, full outfit sets, and coordinated accessories online.
        </p>
        <p className="text-sm leading-relaxed text-gray-500">
          She wear it well คือบริการเช่าชุดแฟชั่นออนไลน์ ที่ช่วยให้แต่งตัวสวยได้ในราคาที่จับต้องได้และยั่งยืนกว่า
          แทนที่จะซื้อชุดราคาแพงที่ใส่เพียงครั้งเดียว คุณเช่าเสื้อ กางเกง/กระโปรง ชุดเซต
          และแอคเซสเซอรี่ที่คัดมาแมตช์กันแล้วได้ง่ายๆ ออนไลน์
        </p>

        <div className="border-t border-gray-100 pt-5">
          <p className="mb-3 text-sm font-semibold">ติดต่อสอบถามได้ที่</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark w-full !py-3 sm:w-auto"
          >
            📸 Instagram: @swiw.offi
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        <Link href="/" className="underline">← กลับหน้าแรก</Link>
      </p>
    </div>
  );
}
