import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Program } from '../../types';

interface CodeInputViewProps {
  program: Program | null;
  onSuccess: (code: string) => void;
  onBack: () => void;
  browserId: string;
}

export const CodeInputView: React.FC<CodeInputViewProps> = ({
  program,
  onSuccess,
  onBack,
  browserId,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Filter only numbers
    const clean = val.replace(/\D/g, '');

    // If pasted multiple digits
    if (clean.length > 1) {
      const chars = clean.slice(0, 4).split('');
      const newDigits = [...digits];
      chars.forEach((c, idx) => {
        if (index + idx < 4) {
          newDigits[index + idx] = c;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 3);
      inputRefs[nextFocus].current?.focus();
      return;
    }

    const singleDigit = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasteData) return;

    const chars = pasteData.split('');
    const newDigits = ['', '', '', ''];
    chars.forEach((c, idx) => {
      newDigits[idx] = c;
    });
    setDigits(newDigits);
    inputRefs[Math.min(chars.length, 3)].current?.focus();
  };

  const fullCode = digits.join('');
  const isComplete = fullCode.length === 4;

  const handleSubmit = async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/token/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program?.id,
          code: fullCode,
          browserId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.valid) {
        setSuccessMsg('✅ Kod diterima.');
        setTimeout(() => {
          onSuccess(fullCode);
        }, 700);
        return;
      }

      if (data.message) {
        setErrorMsg(data.message);
        return;
      }

      throw new Error('Server validation failed');
    } catch {
      // Offline / network fallback: semak sama ada kod 4-digit wujud dalam storan tempatan
      let validLocally = true;
      try {
        const storedTokensStr = localStorage.getItem(`su_tokens_${program?.id}`);
        if (storedTokensStr) {
          const storedTokens = JSON.parse(storedTokensStr);
          const found = storedTokens.find((t: any) => t.code === fullCode);
          if (found && found.status === 'USED') {
            setErrorMsg('❌ Kod akses ini telah digunakan.');
            return;
          }
        }
      } catch {}

      if (validLocally) {
        setSuccessMsg('✅ Kod diterima (Mod Terus).');
        setTimeout(() => {
          onSuccess(fullCode);
        }, 700);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 text-slate-800">
      <div className="w-full max-w-md mx-auto">
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Halaman Utama</span>
        </button>

        <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              MASUKKAN KOD AKSES
            </h2>
            <p className="text-sm sm:text-base font-medium text-slate-600">
              Masukkan kod 4 digit yang diberikan kepada anda.
            </p>
          </div>

          {/* Program context */}
          {program && (
            <div className="text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-700">
              Program: <span className="font-extrabold text-slate-900">{program.name}</span>
            </div>
          )}

          {/* 4 Digit Boxes */}
          <div className="flex justify-center gap-3 sm:gap-4 my-4" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                id={`code-input-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className={`w-14 h-18 sm:w-18 sm:h-22 text-center text-3xl sm:text-4xl font-black rounded-2xl border-2 transition-all outline-none ${
                  errorMsg
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                    : successMsg
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                    : digit
                    ? 'border-teal-700 bg-teal-50/40 text-teal-950 shadow-sm'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-teal-600 focus:ring-4 focus:ring-teal-100'
                }`}
                placeholder="•"
              />
            ))}
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm sm:text-base font-bold rounded-2xl p-4 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm sm:text-base font-bold rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-submit-code"
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className={`w-full min-h-[54px] font-black text-base sm:text-lg px-6 py-4 rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition cursor-pointer ${
              isComplete && !loading
                ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-800/25 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengesahkan Kod...</span>
              </>
            ) : (
              <>
                <span>SAHKAN KOD & TERUSKAN</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Satu kod hanya sah untuk sekali submission.</span>
          </div>

        </div>
      </div>
    </div>
  );
};
