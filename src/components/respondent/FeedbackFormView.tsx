import React, { useState } from 'react';
import {
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  Shield,
  HelpCircle,
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

export interface FormDataState {
  rating: number;
  strengths: string;
  weaknesses: string;
  areasToImprove: string[];
  unresolvedIssues: string;
  blockingIssues: string;
  doDifferently: string;
  changeOneThing: string;
  mustRetain: string;
  additionalComments: string;
}

interface FeedbackFormViewProps {
  program: Program | null;
  code: string;
  initialData?: FormDataState;
  onReview: (data: FormDataState) => void;
  onCancel: () => void;
}

const IMPROVEMENT_AREAS = [
  'Pendaftaran',
  'Pengurusan peserta',
  'Pengurusan urusetia',
  'Masa / jadual',
  'Komunikasi',
  'Logistik',
  'Teknikal / PA System',
  'Makanan',
  'Keselamatan',
  'Dokumentasi',
  'Lain-lain',
];

const RATING_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: '1 — Sangat Lemah', desc: 'Banyak isu kritikal yang menjejaskan matlamat' },
  2: { title: '2 — Kurang Memuaskan', desc: 'Perlu banyak pembaikan dan rombakan penting' },
  3: { title: '3 — Sederhana', desc: 'Boleh diterima namun banyak ruang penambahbaikan' },
  4: { title: '4 — Baik & Lancar', desc: 'Berjalan lancar dengan kepincangan yang kecil sahaja' },
  5: { title: '5 — Cemerlang', desc: 'Pelaksanaan sangat mantap dan melebihi jangkaan' },
};

export const FeedbackFormView: React.FC<FeedbackFormViewProps> = ({
  program,
  code,
  initialData,
  onReview,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState<FormDataState>(
    initialData || {
      rating: 4,
      strengths: '',
      weaknesses: '',
      areasToImprove: [],
      unresolvedIssues: '',
      blockingIssues: '',
      doDifferently: '',
      changeOneThing: '',
      mustRetain: '',
      additionalComments: '',
    }
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleArea = (area: string) => {
    setFormData((prev) => {
      const exists = prev.areasToImprove.includes(area);
      if (exists) {
        return { ...prev, areasToImprove: prev.areasToImprove.filter((a) => a !== area) };
      } else {
        return { ...prev, areasToImprove: [...prev.areasToImprove, area] };
      }
    });
  };

  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!formData.rating) {
        setValidationError('⚠️ Sila pilih penilaian bintang keseluruhan bagi Soalan 1.');
        return;
      }
      if (!formData.strengths.trim()) {
        setValidationError('⚠️ Sila lengkapkan Soalan 2: Nyatakan sekurang-kurangnya satu perkara yang berjalan dengan baik.');
        return;
      }
      if (!formData.weaknesses.trim()) {
        setValidationError('⚠️ Sila lengkapkan Soalan 3: Nyatakan kelemahan paling ketara sepanjang program.');
        return;
      }
      if (formData.areasToImprove.length === 0) {
        setValidationError('⚠️ Sila lengkapkan Soalan 4: Pilih sekurang-kurangnya satu bahagian untuk penambahbaikan.');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      onReview(formData);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-4 sm:py-8 px-3 sm:px-6 text-slate-800">
      <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header with program title and token badge */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                Borang Post-Mortem
              </span>
              <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Anonymous</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1.5 leading-snug">
              {program?.name || 'Program Post-Mortem'}
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-sm sm:text-base bg-slate-900 text-white font-mono font-extrabold px-3 py-1.5 rounded-xl shadow-xs">
              KOD: {code}
            </span>
          </div>
        </div>

        {/* Step Navigation & Mobile Progress */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          {/* Step description */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
              {step === 1 && 'Bahagian 1 dari 3: Penilaian Asas Program'}
              {step === 2 && 'Bahagian 2 dari 3: Isu & Kekangan Di Lapangan'}
              {step === 3 && 'Bahagian 3 dari 3: Cadangan & Solusi Masa Depan'}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Langkah {step} / 3
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
            />
          </div>

          {/* Step Tabs */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`py-2 px-1 rounded-xl transition border text-left sm:text-center ${
                step === 1
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : step > 1
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-[10px] sm:text-xs opacity-80 uppercase">Langkah 1</div>
              <div className="font-extrabold truncate">01 Penilaian</div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (step > 2 || (formData.rating && formData.strengths && formData.weaknesses && formData.areasToImprove.length)) {
                  setStep(2);
                }
              }}
              className={`py-2 px-1 rounded-xl transition border text-left sm:text-center ${
                step === 2
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : step > 2
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-[10px] sm:text-xs opacity-80 uppercase">Langkah 2</div>
              <div className="font-extrabold truncate">02 Isu Tugas</div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (step === 3) setStep(3);
              }}
              className={`py-2 px-1 rounded-xl transition border text-left sm:text-center ${
                step === 3
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-[10px] sm:text-xs opacity-80 uppercase">Langkah 3</div>
              <div className="font-extrabold truncate">03 Cadangan</div>
            </button>
          </div>
        </div>

        {/* Step Contents */}
        <div className="space-y-6">
          
          {/* ======================================================== */}
          {/* BAHAGIAN 1: SOALAN 1, 2, 3, 4                            */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ---------------------------------------------------- */}
              {/* SOALAN 1 CARD (Rating)                               */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-teal-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-teal-100">
                  <div className="inline-flex items-center gap-2 bg-teal-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>SOALAN 1 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    * Wajib Dijawab
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Secara keseluruhan, bagaimana anda menilai kelancaran dan kejayaan program ini?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Sentuh atau klik pada tahap penilaian 1 hingga 5 di bawah:
                  </p>
                </div>

                {/* Rating 1 - 5 Buttons (Big touch targets for mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = formData.rating === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, rating: val }))}
                        className={`min-h-[58px] sm:min-h-[96px] p-3.5 sm:p-3 rounded-2xl border-2 text-center transition flex sm:flex-col items-center justify-between sm:justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 border-teal-700 text-white font-extrabold shadow-md ring-4 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'fill-amber-300 text-amber-300' : 'text-slate-400'}`} />
                          <span className="text-xl sm:text-2xl font-black">{val}</span>
                        </div>
                        <div className="text-right sm:text-center">
                          <span className={`text-xs sm:text-xs block font-bold leading-tight ${isSelected ? 'text-teal-100' : 'text-slate-600'}`}>
                            {val === 1 && 'Sangat Lemah'}
                            {val === 2 && 'Kurang Puas'}
                            {val === 3 && 'Sederhana'}
                            {val === 4 && 'Baik'}
                            {val === 5 && 'Cemerlang'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Rating Description Banner */}
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-900">
                  <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Status Pilihan: <strong>{RATING_LABELS[formData.rating].title}</strong> — {RATING_LABELS[formData.rating].desc}</span>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 2 CARD (Strengths / Perkara Berjalan Baik)    */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                  <div className="inline-flex items-center gap-2 bg-emerald-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <ThumbsUp className="w-4 h-4 text-emerald-200" />
                    <span>SOALAN 2 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    * Wajib Dijawab
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Apakah perkara atau aspek yang telah berjalan dengan sangat baik sepanjang program?
                  </h3>
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-medium">
                    💡 <strong>Contoh respon:</strong> Kerjasama urusetia yang pantas, pendaftaran peserta lancar, makanan sedap, sistem audio jelas, sambutan tetamu sangat memberangsangkan.
                  </div>
                </div>

                <textarea
                  id="input-strengths"
                  rows={4}
                  value={formData.strengths}
                  onChange={(e) => setFormData((prev) => ({ ...prev, strengths: e.target.value }))}
                  placeholder="Kongsikan kejayaan, perkara positif atau pujian terhadap kelancaran program..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 3 CARD (Weaknesses / Kelemahan Ketara)        */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-100">
                  <div className="inline-flex items-center gap-2 bg-amber-700 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-200" />
                    <span>SOALAN 3 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    * Wajib Dijawab
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Apakah kelemahan atau kepincangan paling ketara yang anda perhatikan?
                  </h3>
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium">
                    💡 <strong>Contoh respon:</strong> Arahan lambat sampai, dewan terlalu panas, masa berlarutan melepasi jadual, walkie-talkie rosak, maklumat tentatif bertukar saat akhir.
                  </div>
                </div>

                <textarea
                  id="input-weaknesses"
                  rows={4}
                  value={formData.weaknesses}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weaknesses: e.target.value }))}
                  placeholder="Nyatakan kelemahan utama secara jujur demi penambahbaikan..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-amber-600 focus:ring-4 focus:ring-amber-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 4 CARD (Areas To Improve / Kategori Pilihan) */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-indigo-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                  <div className="inline-flex items-center gap-2 bg-indigo-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Sliders className="w-4 h-4 text-indigo-200" />
                    <span>SOALAN 4 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    * Wajib (Pilih sekurang-kurangnya 1)
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Bahagian manakah yang paling memerlukan penambahbaikan segera?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Anda boleh memilih lebih daripada satu kategori:
                  </p>
                </div>

                {/* Big touch buttons */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {IMPROVEMENT_AREAS.map((area) => {
                    const isSelected = formData.areasToImprove.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        className={`min-h-[46px] text-sm sm:text-base font-bold px-4 py-2.5 rounded-xl border-2 transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-700 border-indigo-700 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-white text-indigo-700 border-white' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                        </div>
                        <span>{area}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* BAHAGIAN 2: SOALAN 5, 6                                  */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ---------------------------------------------------- */}
              {/* SOALAN 5 CARD (Isu Belum Selesai)                    */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-purple-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-100">
                  <div className="inline-flex items-center gap-2 bg-purple-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Clock className="w-4 h-4 text-purple-200" />
                    <span>SOALAN 5 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Adakah terdapat sebarang masalah yang timbul tetapi tidak sempat diselesaikan semasa acara berlangsung?
                  </h3>
                  <div className="mt-2 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs sm:text-sm text-purple-950 font-medium">
                    💡 <strong>Contoh:</strong> Bunting arah laluan surau tak sempat dipasang, hadiah cabutan bertuah kurang kuantiti, salah cetak sijil penghargaan.
                  </div>
                </div>

                <textarea
                  id="input-unresolved"
                  rows={4}
                  value={formData.unresolvedIssues}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unresolvedIssues: e.target.value }))}
                  placeholder="Kongsikan isu atau masalah yang terpaksa diabaikan atau diselesaikan secara ad-hoc saat akhir..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 6 CARD (Halangan & Gangguan Tugas)             */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-rose-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-rose-100">
                  <div className="inline-flex items-center gap-2 bg-rose-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Flame className="w-4 h-4 text-rose-200" />
                    <span>SOALAN 6 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Apakah kekangan atau masalah yang paling mengganggu kelancaran tugas anda sebagai urusetia?
                  </h3>
                  <div className="mt-2 p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs sm:text-sm text-rose-950 font-medium">
                    💡 <strong>Contoh:</strong> Tiada giliran rehat makan tengah hari, ketidakjelasan ketua biro yang perlu dirujuk bila VIP hadir awal, perkakas logistik tidak cukup.
                  </div>
                </div>

                <textarea
                  id="input-blocking"
                  rows={4}
                  value={formData.blockingIssues}
                  onChange={(e) => setFormData((prev) => ({ ...prev, blockingIssues: e.target.value }))}
                  placeholder="Ceritakan cabaran kerja yang menyebabkan tugas anda tergendala atau tekanan yang tidak perlu..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* BAHAGIAN 3: SOALAN 7, 8, 9, 10                           */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ---------------------------------------------------- */}
              {/* SOALAN 7 CARD (Cara Berbeza)                         */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-cyan-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-100">
                  <div className="inline-flex items-center gap-2 bg-cyan-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Lightbulb className="w-4 h-4 text-cyan-200" />
                    <span>SOALAN 7 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Apa yang sepatutnya dilakukan dengan cara berbeza pada penganjuran program akan datang?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Cadangan alternatif kaedah pelaksanaan atau persediaan awal.
                  </p>
                </div>

                <textarea
                  id="input-do-differently"
                  rows={3}
                  value={formData.doDifferently}
                  onChange={(e) => setFormData((prev) => ({ ...prev, doDifferently: e.target.value }))}
                  placeholder="Contoh: Buat raptai penuh sehari lebih awal, gunakan sistem QR code untuk semakan kehadiran..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 8 CARD (Ubah 1 Perkara Sahaja)                */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-100">
                  <div className="inline-flex items-center gap-2 bg-amber-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <Zap className="w-4 h-4 text-amber-200" />
                    <span>SOALAN 8 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Jika anda diberi kuasa untuk ubah SATU perkara sahaja daripada program ini, apakah perkara tersebut?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Satu keutamaan tertinggi yang paling penting untuk dirombak.
                  </p>
                </div>

                <textarea
                  id="input-change-one-thing"
                  rows={3}
                  value={formData.changeOneThing}
                  onChange={(e) => setFormData((prev) => ({ ...prev, changeOneThing: e.target.value }))}
                  placeholder="Satu perkara paling kritikal yang perlu diubah..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-amber-600 focus:ring-4 focus:ring-amber-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 9 CARD (Wajib Dikekalkan)                     */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                  <div className="inline-flex items-center gap-2 bg-emerald-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <BookmarkCheck className="w-4 h-4 text-emerald-200" />
                    <span>SOALAN 9 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Apakah perkara atau amalan yang WAJIB dikekalkan untuk program akan datang?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Formula kejayaan atau tradisi yang jangan sesekali diubah.
                  </p>
                </div>

                <textarea
                  id="input-must-retain"
                  rows={3}
                  value={formData.mustRetain}
                  onChange={(e) => setFormData((prev) => ({ ...prev, mustRetain: e.target.value }))}
                  placeholder="Perkara cemerlang yang wajib diteruskan..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* SOALAN 10 CARD (Komen & Mesej Penting)               */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white border-2 border-slate-400 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="inline-flex items-center gap-2 bg-slate-800 text-white text-xs sm:text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
                    <MessageSquare className="w-4 h-4 text-slate-200" />
                    <span>SOALAN 10 DARI 10</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Pilihan
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                    Ada apa-apa komen lain atau luahan penting yang anda rasa pihak pengurusan perlu tahu?
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Ruang bebas untuk sebarang cadangan, penghargaan, atau mesej terus kepada kepimpinan.
                  </p>
                </div>

                <textarea
                  id="input-additional-comments"
                  rows={4}
                  value={formData.additionalComments}
                  onChange={(e) => setFormData((prev) => ({ ...prev, additionalComments: e.target.value }))}
                  placeholder="Tuliskan pandangan ikhlas anda di sini..."
                  className="w-full text-base sm:text-lg rounded-xl border-2 border-slate-200 p-4 focus:border-slate-800 focus:ring-4 focus:ring-slate-200 outline-none transition bg-slate-50/60 leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm sm:text-base font-bold rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs animate-in fade-in">
              <HelpCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Navigation Bottom Sticky/Card Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[50px] sm:min-h-[54px] px-5 sm:px-7 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-sm sm:text-base transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{step === 1 ? 'Batal' : 'Sebelumnya'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="min-h-[50px] sm:min-h-[54px] px-6 sm:px-9 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-black text-sm sm:text-lg shadow-md shadow-teal-800/25 transition flex items-center gap-2.5 cursor-pointer"
            >
              <span>{step === 3 ? 'SEMAK MAKLUM BALAS' : 'Seterusnya'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
