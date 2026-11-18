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
          <footer className="mt-12 bg-brand-black px-4 py-8 text-center text-xs text-gray-400">
            <p className="font-brand text-xl font-bold text-white">She wear it well</p>
            <p className="mx-auto mt-2 max-w-xl leading-relaxed">
              An online fashion rental platform designed to make stylish dressing affordable and sustainable.
              Rent curated tops, bottoms, full outfit sets, and coordinated accessories.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a href="/contact" className="rounded-lg border border-white/20 px-3 py-1.5 font-medium text-white hover:bg-white/10">
                Contact us
              </a>
              <a
                href="https://www.instagram.com/swiw.offi/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-brand-pinkAccent/40 bg-brand-pinkAccent/10 px-3 py-1.5 font-medium text-brand-pinkMedium hover:bg-brand-pinkAccent/20"
              >
                Instagram: @swiw.offi
              </a>
            </div>
            <p className="mt-5 text-gray-500">© 2026 She wear it well</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
