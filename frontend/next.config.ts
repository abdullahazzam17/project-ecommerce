import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan device lain di LAN (HP/demo client) memuat resource dev server
  // Format: hostname saja, tanpa https:// dan tanpa port (per docs Next.js)
  allowedDevOrigins: ["192.168.0.1"],
};

export default nextConfig;
