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


/**
 * FastAPI dapat mengembalikan detail berupa string atau array error validasi.
 * Ubah keduanya menjadi satu pesan teks yang aman dirender React.
 */
export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object") {
          const entry = item as { msg?: unknown; loc?: unknown };
          const loc = Array.isArray(entry.loc)
            ? entry.loc.filter((part) => part !== "body" && part !== "query" && part !== "path").join(".")
            : "";
          const msg = typeof entry.msg === "string" ? entry.msg : "";
          return [loc, msg].filter(Boolean).join(": ");
        }
        return typeof item === "string" ? item : "";
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(". ");
  }

  return fallback;
}
