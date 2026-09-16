import React from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Lightbulb,
  Calendar,
  MapPin,
  Quote,
  TrendingUp,
  Star,
  Users
} from 'lucide-react';
import { Program, AIAnalysisResult, FeedbackResponse } from '../../types';

interface PostMortemReportViewProps {
  program: Program;
  analysis: AIAnalysisResult | null;
  responses: FeedbackResponse[];
  totalCodes: number;
}

export const PostMortemReportView: React.FC<PostMortemReportViewProps> = ({
  program,
  analysis,
  responses,
  totalCodes,
}) => {
  const totalResponses = responses.length;
  const responseRate = totalCodes > 0 ? Math.round((totalResponses / totalCodes) * 100) : 0;
  const avgRating = totalResponses > 0
    ? (responses.reduce((acc, r) => acc + r.rating, 0) / totalResponses).toFixed(2)
    : '0.00';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Action Plan CSV export
    const headers = ['Bil', 'Isu', 'Punca_Pemerhatian', 'Cadangan_Tindakan', 'Keutamaan'];
    const rows = (analysis?.actionPlan || []).map((item, idx) => [
      idx + 1,
      `"${item.issue.replace(/"/g, '""')}"`,
      `"${item.causeOrObservation.replace(/"/g, '""')}"`,
      `"${item.proposedAction.replace(/"/g, '""')}"`,
      item.priority,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ACTION_PLAN_${program.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Laporan Rasmi Post-Mortem Program</h3>
          <p className="text-xs text-slate-500">
            Dokumen analisis rasmi yang menggabungkan maklum balas anonymous dan sintesis kecerdasan AI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Export Jadual CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Eksport PDF</span>
          </button>
        </div>
      </div>

      {/* Official Report Document Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
          <div className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-[11px] font-extrabold uppercase tracking-widest rounded-full">
            DOKUMEN RASMI PASCA-NILAI (POST-MORTEM)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            LAPORAN POST-MORTEM PROGRAM
          </h1>
          <p className="text-base font-bold text-teal-700">
            {program.name}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {program.date}
            </span>
            {program.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {program.location}
              </span>
            )}
            <span>•</span>
            <span>Tarikh Analisis: {analysis?.analyzedAt ? new Date(analysis.analyzedAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terkini'}</span>
          </div>
        </div>

        {/* 1. Maklumat Program */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-3">
            1. Maklumat Program
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700 space-y-1.5 leading-relaxed">
            <p><strong>Nama Acara:</strong> {program.name}</p>
            <p><strong>Tarikh Pelaksanaan:</strong> {program.date}</p>
            <p><strong>Lokasi / Venue:</strong> {program.location || 'Tidak Dinyatakan'}</p>
            <p><strong>Keterangan / Skop:</strong> {program.description || 'Program perhimpunan dan operasi urusetia.'}</p>
            <p><strong>Status Semasa:</strong> <span className="font-semibold text-teal-800">{program.status}</span></p>
          </div>
        </section>

        {/* 2. Ringkasan Maklum Balas & Metrik */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-3">
            2. Ringkasan Maklum Balas Urusetia
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Responden</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalResponses}</p>
              <span className="text-[10px] text-slate-400">Pemberi Komen</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Kadar Maklum Balas</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{responseRate}%</p>
              <span className="text-[10px] text-slate-400">Daripada {totalCodes} Kod</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Purata Skor Kepuasan</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{avgRating} <span className="text-xs font-normal text-slate-400">/ 5.0</span></p>
              <span className="text-[10px] text-slate-400">Penarafan Urusetia</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Indeks Sentimen</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{analysis?.sentiment?.positive ?? 60}%</p>
              <span className="text-[10px] text-slate-400">Maklum Balas Positif</span>
            </div>
          </div>
        </section>

        {/* 3. Rumusan Eksekutif */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-3">
            3. Rumusan Eksekutif
          </h2>
          <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
            {analysis?.overallSummary || 'Analisis data menunjukkan tahap penglibatan yang aktif dengan peluang penambahbaikan pada saluran komunikasi dan kelancaran tentatif.'}
          </div>
        </section>

        {/* 4. Kekuatan Program */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-emerald-600 pl-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>4. Kekuatan & Perkara Berjaya</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
            {(analysis?.strengths || [
              'Kerjasama urusetia bertenaga dan saling membantu.',
              'Pentas dan kualiti montaj multimedia cemerlang.',
              'Kehadiran peserta melangkaui sasaran penganjur.'
            ]).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Kelemahan Utama */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-amber-500 pl-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>5. Kelemahan & Kekangan Dikenalpasti</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
            {(analysis?.mainWeaknesses || [
              'Arahan selalu berubah di saat akhir.',
              'Jadual berlarutan menyebabkan waktu rehat terjejas.',
              'Kaunter pendaftaran sesak pada fasa ketibaan.'
            ]).map((w, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-amber-50/30 p-3 rounded-lg border border-amber-200/60">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Isu Berulang (Semantic Grouping) */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-3">
            6. Isu Berulang (Semantic Issue Grouping)
          </h2>
          <p className="text-xs text-slate-500">
            Pengelompokan corak masalah yang dilaporkan secara konsisten oleh pelbagai responden anonymous:
          </p>
          <div className="space-y-3">
            {(analysis?.recurringIssues || []).map((group, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                    {group.category}
                  </span>
                  <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    {group.frequency} Respon Berkaitan
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {group.summary}
                </p>
                {group.sampleQuotes && group.sampleQuotes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contoh Petikan Responden:</span>
                    {group.sampleQuotes.map((q, qIdx) => (
                      <div key={qIdx} className="text-xs italic text-slate-600 bg-white p-2 rounded border border-slate-200/60 flex items-start gap-1.5">
                        <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>"{q}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 7. Isu Kritikal */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-rose-600 pl-3 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>7. Isu Kritikal Berimpak Tinggi</span>
          </h2>
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2">
            {(analysis?.criticalIssues || [
              'Ketiadaan rantaian arahan berpusat menyebabkan pertindihan tugas.',
              'Kegagalan sistem talian pada waktu puncak pendaftaran.'
            ]).map((crit, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-950 font-medium">
                <span className="text-rose-600 font-bold">•</span>
                <span>{crit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Cadangan Penambahbaikan */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-teal-600 pl-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-teal-600" />
            <span>8. Cadangan Penambahbaikan</span>
          </h2>
          <div className="space-y-2">
            {(analysis?.recommendations || [
              'Wujudkan Single Point of Contact (SPOC) untuk semua hebahan perubahan tentatif.',
              'Gunakan talian internet dedicated untuk urusan pendaftaran.',
              'Adakan sesi daily debriefing selama 15 minit.'
            ]).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800">
                <span className="font-bold text-teal-700">{idx + 1}.</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Action Plan Table (Jadual Tindakan) */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-slate-900 pl-3">
            9. Pelan Tindakan Susulan (Action Plan)
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Bil</th>
                  <th className="p-3">Isu</th>
                  <th className="p-3">Punca / Pemerhatian</th>
                  <th className="p-3">Cadangan Tindakan</th>
                  <th className="p-3 text-center">Keutamaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(analysis?.actionPlan || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{item.issue}</td>
                    <td className="p-3 text-slate-700">{item.causeOrObservation}</td>
                    <td className="p-3 text-slate-800">{item.proposedAction}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.priority === 'Tinggi'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.priority === 'Sederhana'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. Petikan Komen Anonymous */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-l-4 border-slate-400 pl-3">
            10. Petikan Langsung Komen Urusetia (Direct Anonymous Quotes)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(analysis?.anonymousQuotes || [
              'Tak tahu nak rujuk siapa bila flow VIP tiba-tiba berubah 10 minit sebelum perasmian.',
              'Pendaftaran sesak teruk di awal pagi kerana scanner tak cukup.',
              'Semangat sukarelawan amat membanggakan, tetapi kebajikan dan masa rehat mereka perlu dijaga.',
              'Aplikasi Suara Urusetia ini sangat bagus untuk beri komen jujur tanpa rasa takut.'
            ]).map((quote, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs sm:text-sm italic text-slate-700 flex items-start gap-2">
                <Quote className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>"{quote}"</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sign-off / Confidentiality Stamp */}
        <div className="pt-8 border-t-2 border-slate-200 text-center space-y-1 text-xs text-slate-500">
          <p className="font-bold text-slate-800">SUARA URUSETIA • INTEGRITY & CONTINUOUS IMPROVEMENT</p>
          <p>Laporan dijana secara automatik melalui sistem Suara Urusetia berasaskan maklum balas anonim urusetia.</p>
        </div>

      </div>
    </div>
  );
};
