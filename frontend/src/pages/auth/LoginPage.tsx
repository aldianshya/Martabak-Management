import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user.role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/pos");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Gagal masuk. Periksa email dan password Anda.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/30 text-3xl font-black mb-3 ring-4 ring-brand-500/20">
            🥞
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Sistem Manajemen Martabak
          </h1>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Aplikasi Point of Sale, Stok & Analitik Operasional Martabak
          </p>
        </div>

        {/* Main Form Container */}
        <div className="rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500">Silakan masukkan akun kasir atau pemilik</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email / Username</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@martabak.local"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-slate-600">Ingat sesi saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-brand-500 py-3 text-xs font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>MASUK KE SISTEM</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Akun Demo Cepat:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@martabak.local", "Admin123!")}
                className="flex items-center justify-center space-x-1.5 rounded-lg bg-purple-50 border border-purple-200 py-2 px-2 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin / Owner</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("kasir@martabak.local", "Kasir123!")}
                className="flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-50 border border-emerald-200 py-2 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Kasir Shift</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
