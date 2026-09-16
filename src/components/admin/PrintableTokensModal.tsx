import React, { useState } from 'react';
import { X, Printer, Download, Filter } from 'lucide-react';
import { AccessToken, Program } from '../../types';

interface PrintableTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  tokens: AccessToken[];
}

export const PrintableTokensModal: React.FC<PrintableTokensModalProps> = ({
  isOpen,
  onClose,
  program,
  tokens,
}) => {
  const [filterMode, setFilterMode] = useState<'unused' | 'all'>('unused');

  if (!isOpen) return null;

  const displayedTokens = filterMode === 'unused' ? tokens.filter((t) => t.status === 'UNUSED') : tokens;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Nombor', 'Kod_Akses_4_Digit', 'Status', 'Tarikh_Dicipta'];
    const rows = displayedTokens.map((t, idx) => [
      idx + 1,
      `"${t.code}"`,
      t.status,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KOD_AKSES_${program?.name.replace(/\s+/g, '_') || 'PROGRAM'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header (hidden in print) */}
        <div className="no-print flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Slip Kod Akses Urusetia (Format Cetakan A4)</h3>
            <p className="text-xs text-slate-500">
              Slip sedia untuk dicetak, digunting dan diedarkan secara rawak kepada urusetia program.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('unused')}
                className={`px-2.5 py-1 rounded-md transition ${filterMode === 'unused' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Belum Diguna ({tokens.filter((t) => t.status === 'UNUSED').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition ${filterMode === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Semua ({tokens.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="max-w-[210mm] mx-auto bg-white p-6 shadow-sm border border-slate-200 rounded-xl print:p-0 print:shadow-none print:border-none">
            
            {/* Top program title on printable page */}
            <div className="border-b-2 border-slate-900 pb-3 mb-6 text-center">
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">SUARA URUSETIA</h2>
              <p className="text-xs font-semibold text-slate-700">Slip Kod Akses Anonymous — {program?.name || 'Program Post-Mortem'}</p>
              <p className="text-[11px] text-slate-500">Tarikh: {program?.date} | Lokasi: {program?.location}</p>
            </div>

            {/* Grid of A4 cut-out slips: 3 per row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
              {displayedTokens.map((token, index) => (
                <div
                  key={token.id}
                  className="border-2 border-dashed border-slate-400 p-4 rounded-xl text-center space-y-2 relative bg-white break-inside-avoid"
                >
                  <div className="text-[10px] font-extrabold tracking-wider text-teal-800 uppercase">
                    SUARA URUSETIA
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">
                    KOD AKSES ANONYMOUS
                  </div>
                  <div className="text-3xl font-black tracking-widest font-mono text-slate-900 py-1 bg-slate-50 rounded-lg border border-slate-200">
                    {token.code}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    Sila gunakan kod ini untuk memberikan maklum balas anonymous di portal Suara Urusetia.
                  </p>
                  <div className="text-[9px] text-slate-400 font-mono pt-1">
                    #{index + 1} • Sekali Guna Sahaja
                  </div>
                </div>
              ))}
            </div>

            {displayedTokens.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Tiada kod akses dalam senarai ini. Sila jana kod baharu.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
