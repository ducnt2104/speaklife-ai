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
  description: "Web-App tích hợp Trí tuệ nhân tạo Đa phương thức kết hợp Thị giác xử lý biên (Privacy-Preserving Edge AI) dành cho học sinh Việt Nam. Sản phẩm dự thi Gameshow 'Đấu trường AI' TP. Đồng Nai năm 2026.",
  keywords: ["SpeakLife AI", "Luyện thuyết trình", "Phản biện AI", "MediaPipe Edge AI", "Zero-Data Retention", "Đấu trường AI Đồng Nai"],
  authors: [{ name: "Nguyễn Tiến Đức & Đội thi SpeakLife AI - THPT Tôn Đức Thắng" }],
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
