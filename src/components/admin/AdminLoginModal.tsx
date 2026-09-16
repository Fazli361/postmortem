import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Sila masukkan kata laluan pentadbir.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const cleanU = username.trim().toLowerCase();
    const cleanP = password.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanU, password: cleanP }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onLoginSuccess();
          onClose();
          return;
        }
      }

      // Jika backend memulangkan ralat kelayakan (401)
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Kata laluan atau nama pengguna salah.');
        return;
      }

      throw new Error('Pelayan API tidak dapat dicapai');
    } catch {
      // FALLBACK 1: Kunci Utama Kecemasan (Emergency Master Key)
      if ((cleanU === 'admin' || cleanU === 'urusetia') && cleanP === 'suara2026') {
        onLoginSuccess();
        onClose();
        return;
      }

      // FALLBACK 2: Semak terus ke Webhook Google Sheets dari pelayar jika ada disimpan di localStorage
      try {
        const cachedWebhook = localStorage.getItem('gs_webhook_url');
        if (cachedWebhook && cachedWebhook.startsWith('https://script.google.com')) {
          const directRes = await fetch(cachedWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              type: 'AUTH_ADMIN',
              username: cleanU,
              password: cleanP,
            }),
            redirect: 'follow',
          });

          if (directRes.ok) {
            const data = await directRes.json();
            if (data.authenticated && data.status === 'success') {
              onLoginSuccess();
              onClose();
              return;
            }
            if (data.message) {
              setErrorMsg(data.message);
              return;
            }
          }
        }
      } catch (directErr) {
        console.warn('Direct Google Sheet auth failed:', directErr);
      }

      setErrorMsg('Kredensial tidak sah atau sambungan terputus. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in-95">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Portal Urusetia Pentadbir</h3>
          <p className="text-xs text-slate-500">
            Akses kepada dashboard analitik, penjanaan kod, dan laporan post-mortem.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Pengguna
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kata Laluan
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Log Masuk Pentadbir</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
