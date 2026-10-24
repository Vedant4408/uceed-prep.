import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#0369A1',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'UCEED Prep Lab',
  description:
    'Comprehensive UCEED PYQ practice, timed mock examination interface, Part B drawing studio, and AI-powered performance analytics platform for IIT Bombay design entrance preparation.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UCEED Prep Lab',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'UCEED Prep Lab',
    description:
      'Comprehensive UCEED PYQ practice, timed mock examination interface, Part B drawing studio, and AI-powered performance analytics platform for IIT Bombay design entrance preparation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UCEED Prep Lab',
    description:
      'Comprehensive UCEED PYQ practice, timed mock examination interface, Part B drawing studio, and AI-powered performance analytics platform for IIT Bombay design entrance preparation.',
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('uceed_theme_v1');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = (stored === 'dark' || stored === 'light') ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark' && typeof CSSStyleSheet !== 'undefined' && document.adoptedStyleSheets) {
      var sheet = new CSSStyleSheet();
      sheet.replaceSync(':root { color-scheme: dark; --bg-main: #0B1120; --bg-secondary: #111827; --bg-card: #172033; --bg-elevated: #1E293B; --text-primary: #F1F5F9; --text-secondary: #CBD5E1; --border-color: #334155; --accent-primary: #60A5FA; --color-success: #4ADE80; --color-error: #F87171; } body, .bg-\\\\[\\\\#F8FAFC\\\\] { background-color: #0B1120 !important; color: #F1F5F9 !important; } .bg-white:not(.preserve-light-surface) { background-color: #172033 !important; }');
      window.__uceedPrepaintSheet = sheet;
      document.adoptedStyleSheets = [].concat(Array.from(document.adoptedStyleSheets), [sheet]);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
