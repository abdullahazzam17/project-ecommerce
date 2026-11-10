import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Zoom Cloth | Streetwear and custom apparel",
  description: "Zoom Cloth streetwear storefront: tops, hoodies, and print.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        {/* Snap.js tidak dimuat pada demo mode frontend (tidak ada pembayaran). */}
        {process.env.NEXT_PUBLIC_ENABLE_DEMO_PRODUCTS !== "true" ||
        process.env.NODE_ENV === "production" ? (
          <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="lazyOnload"
          />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
