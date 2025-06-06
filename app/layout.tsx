import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

// Load Inter font for English/Latin content
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Load Cairo font for Arabic content
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeautyBook | Beauty and Wellness Booking Platform",
  description: "Book beauty and wellness services with top providers in your area",
  keywords: ["beauty", "wellness", "booking", "salon", "spa", "barbershop"],
  authors: [{ name: "BeautyBook Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Remove lang attribute as it will be handled by i18n
    <html className={`${inter.variable} ${cairo.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
