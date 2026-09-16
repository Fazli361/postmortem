import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, HeartHandshake, Home } from 'lucide-react';
import { Program } from '../../types';

interface SuccessViewProps {
  program: Program | null;
  onDone: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ program, onDone }) => {
  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch (e) {
      console.log('Confetti effect triggered', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 text-slate-800">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              MAKLUM BALAS BERJAYA DIHANTAR
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Terima kasih kerana memberikan pandangan jujur anda.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privasi Terpelihara Sepenuhnya</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Maklum balas anda telah direkodkan secara <span className="font-bold">anonymous</span> tanpa sebarang identiti diri. Kod akses 4 digit anda kini telah dinyahaktifkan secara kekal.
            </p>
          </div>

          {program && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-600" />
              <span>Program: <strong className="text-slate-700">{program.name}</strong></span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="btn-done"
              type="button"
              onClick={onDone}
              className="w-full min-h-[50px] bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-base px-6 py-3.5 rounded-xl shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>SELESAI</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Anda kini boleh menutup halaman ini atau kembali ke paparan utama.
          </p>

        </div>
      </div>
    </div>
  );
};
