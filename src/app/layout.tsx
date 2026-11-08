import type { Metadata } from "next";
import { Outfit, Work_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Navbar, Footer } from "@/components/ui/Navbar";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
});

const workSans = Work_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-work-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "SpeakLife AI — Phòng luyện phản xạ giao tiếp và thuyết trình thực chiến",
  description: "Nền tảng AI đa phương thức kết hợp Thị giác xử lý biên (Privacy-Preserving Edge AI) và Ban Giám khảo Phản biện Đa chiều dành cho học sinh Việt Nam. Sản phẩm dự thi Gameshow 'Đấu trường AI' TP. Đồng Nai năm 2026.",
  keywords: ["SpeakLife AI", "Luyện thuyết trình", "Phản biện AI", "MediaPipe Edge AI", "Zero-Data Retention", "Đấu trường AI Đồng Nai", "MPRE Rubric"],
  authors: [{ name: "Nguyễn Tiến Đức & Đội thi SpeakLife AI - THPT Tôn Đức Thắng" }],
  metadataBase: new URL(process.env.APP_URL || "https://speaklife-ai.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: "#090D16",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "SpeakLife AI",
    title: "SpeakLife AI — Phòng Luyện Phản Xạ Thuyết Trình Thực Chiến",
    description: "Đánh giá 5 chiều MPRE với Thị giác biên MediaPipe, Đo lường Âm lượng Decibel & 3 Persona Giám khảo Phản biện Đấu trường AI Đồng Nai 2026.",
    images: [
      {
        url: "/brand/logo.svg",
        width: 1200,
        height: 630,
        alt: "SpeakLife AI — Phòng Luyện Thuyết Trình",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeakLife AI — Luyện Phản Xạ Thuyết Trình Đỉnh Cao",
    description: "Nền tảng luyện phản biện AI và thị giác máy tính bảo mật Zero-Data Retention.",
    images: ["/brand/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`scroll-smooth ${outfit.variable} ${workSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary-light selection:text-primary transition-colors duration-200">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
