// Titik pusat konfigurasi API - TIDAK ADA LAGI URL HARDCODE tersebar di file komponen.
// Lokal/HP: http://192.168.0.1:8000. Vercel: URL HTTPS backend publik (bukan IP LAN/localhost).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Biaya penanganan ditambahkan backend saat checkout (backend/main.py: admin_fee).
// Jaga nilai ini sinkron agar rincian di keranjang sama dengan total Midtrans.
export const HANDLING_FEE = 4000;

// Header otorisasi untuk semua panggilan admin dashboard
export function adminAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
