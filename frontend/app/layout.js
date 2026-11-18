import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'She wear it well | บริการเช่าชุดแฟชั่นออนไลน์',
  description: 'เช่าชุดแฟชั่นออนไลน์ ขับรถส่งถึงหน้าหอพัก',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">{children}</main>
          <footer className="mt-12 bg-brand-black py-8 text-center text-xs text-gray-400">
            <p className="font-brand text-xl font-bold text-white">She wear it well</p>
            <p className="mt-1">ร้านเช่าชุดแฟชั่นออนไลน์ พร้อมบริการขับรถจัดส่งถึงหอพัก</p>
            <p className="mt-3 text-gray-500">© 2026 She wear it well</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
