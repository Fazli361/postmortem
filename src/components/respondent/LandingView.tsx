import React from 'react';
import { ShieldCheck, Lock, Sparkles, Calendar, MapPin, ArrowRight, UserCheck, EyeOff, KeyRound } from 'lucide-react';
import { Program } from '../../types';

interface LandingViewProps {
  program: Program | null;
  onStart: () => void;
  onAdminClick: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ program, onStart, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm shadow-teal-700/20">
            SU
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">SUARA URUSETIA</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Anonymous Post-Mortem & Feedback</p>
          </div>
        </div>

        <button
          id="btn-admin-portal-login"
          onClick={onAdminClick}
          className="text-xs font-semibold text-slate-600 hover:text-teal-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
        >
          <KeyRound className="w-3.5 h-3.5 text-teal-600" />
          <span>Portal Urusetia Pentadbir</span>
        </button>
      </header>

      {/* Main Hero Card */}
      <main className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Sistem Maklum Balas Urusetia 100% Bebas Nama</span>
          </div>

          {/* Heading */}
          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Suara Anda, Penambahbaikan Bersama.
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Kami ingin mendapatkan pandangan jujur daripada urusetia yang bertugas. Maklum balas anda adalah <span className="font-bold text-slate-900">100% anonymous</span> dan digunakan sepenuhnya untuk tujuan penambahbaikan program akan datang.
            </p>
          </div>

          {/* Program info banner if available */}
          {program && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 text-sm sm:text-base">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-teal-800 uppercase tracking-wider">Program Aktif</span>
                {program.isDemo && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                    DEMO DATA
                  </span>
                )}
              </div>
              <p className="font-black text-slate-900 text-lg sm:text-xl leading-snug">{program.name}</p>
              <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs sm:text-sm font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  {program.date}
                </span>
                {program.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    {program.location}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Privacy Notice Box (Mandatory spec) */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-emerald-700" />
              <span>🔒 JAMINAN PRIVASI ANONIM</span>
            </div>
            
            <p className="text-xs sm:text-sm text-emerald-950 font-bold">
              Kami menjamin identiti anda dilindungi dan <span className="underline decoration-emerald-500 underline-offset-2">TIDAK MEMINTA</span>:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm font-bold text-emerald-950">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>Nama</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>No. Telefon</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>Emel</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>No. Kad Pengenalan</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs col-span-2 sm:col-span-1">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>Log Masuk Akaun</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-800 pt-1 leading-relaxed">
              Berikan pandangan anda dengan jujur supaya jawatankuasa dapat memperbaiki kelemahan dengan telus.
            </p>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              id="btn-start-feedback"
              onClick={onStart}
              className="w-full min-h-[54px] bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-black text-base sm:text-lg px-6 py-4 rounded-2xl shadow-lg shadow-teal-800/25 flex items-center justify-center gap-3 transition cursor-pointer"
            >
              <span>MULA BERIKAN MAKLUM BALAS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-[12px] text-slate-500 mt-2.5">
              Hanya memerlukan kod akses 4 digit unik yang diedarkan kepada anda.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Post-Mortem Integrity & Anonymous Token Isolation System</span>
        </div>
        <p className="text-[11px] text-slate-400">© 2026 SUARA URUSETIA. Hak Cipta Terpelihara.</p>
      </footer>
    </div>
  );
};
