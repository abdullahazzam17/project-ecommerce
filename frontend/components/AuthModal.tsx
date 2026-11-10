"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import type { User } from "../lib/types";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const resetAuthForm = () => {
    setAuthName("");
    setAuthEmail("");
    setAuthPhone("");
    setAuthPassword("");
    setAuthError("");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
    const bodyData = isRegistering
      ? { name: authName, email: authEmail, phone: authPhone, password: authPassword }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        onSuccess(data.user);
        resetAuthForm();
      } else {
        setAuthError(data.detail || "Terjadi kesalahan.");
      }
    } catch (err) {
      setAuthError("Gagal terhubung ke server. Pastikan layanan toko menyala.");
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md border border-line bg-surface p-6 shadow-2xl md:p-8"
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            resetAuthForm();
          }}
          aria-label="Close sign in"
          className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center text-xl font-black text-muted transition-colors duration-200 hover:text-ink"
        >
          ✕
        </button>

        <h3 id="auth-title" className="mb-6 text-center text-xl font-black uppercase">
          {isRegistering ? "Create account" : "Sign in"}
        </h3>

        {authError ? (
          <p role="alert" className="mb-4 border border-error/30 bg-error/5 p-3 text-center text-xs text-error">
            {authError}
          </p>
        ) : null}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          {isRegistering ? (
            <div>
              <label htmlFor="auth-name" className="mb-1 block font-bold uppercase tracking-widest">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                placeholder="Nama lengkap"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                autoComplete="name"
                className="w-full border border-line bg-canvas p-3 text-ink outline-none transition-colors duration-200 focus:border-ink"
                required
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="auth-email" className="mb-1 block font-bold uppercase tracking-widest">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="nama@email.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              className="w-full border border-line bg-canvas p-3 text-ink outline-none transition-colors duration-200 focus:border-ink"
              required
            />
          </div>

          {isRegistering ? (
            <div>
              <label htmlFor="auth-phone" className="mb-1 block font-bold uppercase tracking-widest">
                WhatsApp number
              </label>
              <input
                id="auth-phone"
                type="tel"
                placeholder="08123456789"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                autoComplete="tel"
                className="w-full border border-line bg-canvas p-3 text-ink outline-none transition-colors duration-200 focus:border-ink"
                required
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="auth-password" className="mb-1 block font-bold uppercase tracking-widest">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="w-full border border-line bg-canvas p-3 text-ink outline-none transition-colors duration-200 focus:border-ink"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 min-h-12 w-full bg-ink py-3 text-xs font-bold uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-[#2b2b2b] active:bg-black"
          >
            {isRegistering ? "Register" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError("");
            }}
            className="min-h-11 font-bold underline transition-opacity duration-200 hover:opacity-60"
          >
            {isRegistering ? "Already have an account? Sign in" : "No account yet? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
