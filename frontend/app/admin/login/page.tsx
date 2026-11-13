"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, apiFetch } from "../../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sudah login? langsung ke dashboard
  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success" && data.token) {
        localStorage.setItem("admin_token", data.token);
        router.replace("/admin/dashboard");
      } else {
        setError(data.message || "Login gagal. Periksa kembali kredensial Anda.");
      }
    } catch (err) {
      setError("Tidak bisa terhubung ke server. Pastikan backend menyala.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Kartu Login */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
              Z
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Zoom Custom Admin</h1>
            <p className="text-xs text-slate-500 mt-1">Masuk untuk mengelola toko Anda</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          © 2026 ZOOM.CLOTH INC. — Portal Internal
        </p>
      </div>
    </div>
  );
}
