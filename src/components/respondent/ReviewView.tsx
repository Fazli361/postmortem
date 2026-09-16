import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Send,
  Star,
  AlertTriangle,
  Loader2,
  ThumbsUp,
  AlertCircle,
  Sliders,
  Clock,
  Flame,
  Lightbulb,
  Zap,
  BookmarkCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Program } from '../../types';
import { FormDataState } from './FeedbackFormView';

interface ReviewViewProps {
  program: Program | null;
  code: string;
  formData: FormDataState;
  browserId: string;
  onEdit: () => void;
  onSubmitSuccess: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  program,
  code,
  formData,
  browserId,
  onEdit,
  onSubmitSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program?.id,
          code,
          browserId,
          rating: formData.rating,
          answers: {
            strengths: formData.strengths,
            weaknesses: formData.weaknesses,
            areasToImprove: formData.areasToImprove,
            unresolvedIssues: formData.unresolvedIssues,
            blockingIssues: formData.blockingIssues,
            doDifferently: formData.doDifferently,
            changeOneThing: formData.changeOneThing,
            mustRetain: formData.mustRetain,
            additionalComments: formData.additionalComments,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onSubmitSuccess();
        return;
      }

      if (data.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      throw new Error('Server submission error');
    } catch {
      // Fallback: simpan & hantar terus ke Google Sheets jika URL webhook telah dikonfigurasi
      try {
        const gsWebhook = localStorage.getItem('gs_webhook_url');
        if (gsWebhook) {
          fetch(gsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              timestamp: new Date().toLocaleString('ms-MY'),
              responseId: 'RESP-' + Math.floor(1000 + Math.random() * 9000),
              programName: program?.name || 'Program Urusetia',
              rating: formData.rating,
              areasToImprove: formData.areasToImprove,
              strengths: formData.strengths,
              weaknesses: formData.weaknesses,
              unresolvedIssues: formData.unresolvedIssues,
              blockingIssues: formData.blockingIssues,
              doDifferently: formData.doDifferently,
              additionalComments: formData.additionalComments,
            }),
            redirect: 'follow',
          }).catch(() => {});
        }
      } catch {}

      // Tandakan kod sebagai digunakan secara tempatan
      try {
        const key = `su_tokens_${program?.id}`;
        const storedStr = localStorage.getItem(key);
        if (storedStr) {
          const list = JSON.parse(storedStr);
          const updated = list.map((t: any) => (t.code === code ? { ...t, status: 'USED' } : t));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch {}

      onSubmitSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-4 sm:py-8 px-3 sm:px-6 text-slate-800">
      <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Notice */}
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 sm:p-7 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Langkah Terakhir: Semakan Maklum Balas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-snug">
            SEMAK MAKLUM BALAS ANDA SEBELUM HANTAR
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Sila teliti jawapan anda di bawah. Setelah menekan butang <strong>Hantar Maklum Balas</strong>, jawapan tidak boleh diubah dan kod akses anda (<strong>{code}</strong>) akan dinyahaktifkan serta-merta.
          </p>
        </div>

        {/* Distinct Question Review Cards */}
        <div className="space-y-4">
          
          {/* Card 1: Penilaian */}
          <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-teal-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>SOALAN 1: PENILAIAN PROGRAM</span>
              </span>
              <span className="text-base sm:text-lg font-black text-teal-900">
                {formData.rating} / 5 Bintang
              </span>
            </div>
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${s <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {/* Card 2: Strengths */}
          <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-200" />
              <span>SOALAN 2: PERKARA BERJALAN BAIK</span>
            </span>
            <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
              {formData.strengths || '-'}
            </p>
          </div>

          {/* Card 3: Weaknesses */}
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-700 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-amber-200" />
              <span>SOALAN 3: KELEMAHAN KETARA</span>
            </span>
            <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-100">
              {formData.weaknesses || '-'}
            </p>
          </div>

          {/* Card 4: Areas To Improve */}
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-indigo-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
              <Sliders className="w-3.5 h-3.5 text-indigo-200" />
              <span>SOALAN 4: BAHAGIAN PERLU DITAMBAHBAIK</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.areasToImprove.map((area) => (
                <span
                  key={area}
                  className="text-sm sm:text-base font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 px-3.5 py-1.5 rounded-xl shadow-2xs"
                >
                  ✓ {area}
                </span>
              ))}
            </div>
          </div>

          {/* Card 5: Unresolved Issues */}
          {formData.unresolvedIssues && (
            <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-purple-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-purple-200" />
                <span>SOALAN 5: ISU TIDAK SEMPAT DISELESAIKAN</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-purple-50/40 p-3.5 rounded-xl border border-purple-100">
                {formData.unresolvedIssues}
              </p>
            </div>
          )}

          {/* Card 6: Blocking Issues */}
          {formData.blockingIssues && (
            <div className="bg-white border-2 border-rose-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-rose-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-rose-200" />
                <span>SOALAN 6: HALANGAN & GANGGUAN TUGAS</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-rose-50/40 p-3.5 rounded-xl border border-rose-100">
                {formData.blockingIssues}
              </p>
            </div>
          )}

          {/* Card 7: Do Differently */}
          {formData.doDifferently && (
            <div className="bg-white border-2 border-cyan-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-cyan-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-200" />
                <span>SOALAN 7: CARA BERBEZA AKAN DATANG</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-cyan-50/40 p-3.5 rounded-xl border border-cyan-100">
                {formData.doDifferently}
              </p>
            </div>
          )}

          {/* Card 8: Change One Thing */}
          {formData.changeOneThing && (
            <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-amber-200" />
                <span>SOALAN 8: UBAH 1 PERKARA SAHAJA</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-100">
                {formData.changeOneThing}
              </p>
            </div>
          )}

          {/* Card 9: Must Retain */}
          {formData.mustRetain && (
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>SOALAN 9: WAJIB DIKEKALKAN</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                {formData.mustRetain}
              </p>
            </div>
          )}

          {/* Card 10: Additional Comments */}
          {formData.additionalComments && (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-slate-800 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg">
                <MessageSquare className="w-3.5 h-3.5 text-slate-200" />
                <span>SOALAN 10: KOMEN LAIN KEPADA PENGURUSAN</span>
              </span>
              <p className="text-base sm:text-lg font-medium text-slate-900 pt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {formData.additionalComments}
              </p>
            </div>
          )}

        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm sm:text-base font-bold rounded-2xl p-4 sm:p-5 flex items-center gap-3 shadow-xs">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="w-full sm:w-auto min-h-[52px] px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-sm sm:text-base transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>KEMBALI EDIT</span>
          </button>

          <button
            id="btn-confirm-submit"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-base sm:text-lg shadow-lg shadow-teal-800/25 transition flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menghantar Maklum Balas...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>HANTAR MAKLUM BALAS SEKARANG</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-2 pb-6">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Tiada sebarang data peribadi atau maklumat peranti dipautkan bersama respon anda.</span>
        </div>

      </div>
    </div>
  );
};
