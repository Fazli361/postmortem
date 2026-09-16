import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  KeyRound,
  MessageSquare,
  Sparkles,
  FileText,
  Settings,
  Plus,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Star,
  Printer,
  Download,
  Filter,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
  Clock,
  Layers,
  BarChart3,
  Loader2,
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import {
  Program,
  AccessToken,
  FeedbackResponse,
  AIAnalysisResult,
  DashboardStats,
  ProgramStatus
} from '../../types';
import {
  DEMO_PROGRAM_ID,
  INITIAL_DEMO_PROGRAM,
  generateInitialDemoTokens,
  INITIAL_DEMO_RESPONSES,
  INITIAL_DEMO_AI_ANALYSIS
} from '../../demoData';
import { PrintableTokensModal } from './PrintableTokensModal';
import { PostMortemReportView } from './PostMortemReportView';
import { GoogleSheetsView } from './GoogleSheetsView';

interface AdminDashboardProps {
  onLogout: () => void;
  onViewRespondentPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onViewRespondentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'programs' | 'tokens' | 'feedback' | 'ai' | 'report' | 'sheets' | 'settings'
  >('dashboard');

  // Programs state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Active program data
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Delete Program Modal state
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // New Program Modal state
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDate, setNewProgramDate] = useState('');
  const [newProgramLocation, setNewProgramLocation] = useState('');
  const [newProgramDesc, setNewProgramDesc] = useState('');
  const [creatingProgram, setCreatingProgram] = useState(false);

  // Generate Tokens state
  const [tokenCountToGen, setTokenCountToGen] = useState<number>(30);
  const [generatingTokens, setGeneratingTokens] = useState(false);
  const [tokenSuccessMsg, setTokenSuccessMsg] = useState<string | null>(null);

  // Printable Tokens Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // AI Analysis state
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

  // Feedback filter state
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings feedback
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const activeProgram = programs.find((p) => p.id === selectedProgramId) || programs[0] || null;

  // 1. Fetch programs
  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const res = await fetch('/api/admin/programs');
      if (res.ok) {
        const data: Program[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPrograms(data);
          try {
            localStorage.setItem('su_programs', JSON.stringify(data));
          } catch {}
          if (!selectedProgramId) {
            setSelectedProgramId(data[0].id);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch programs from server, using local store/demo data:', err);
    } finally {
      setLoadingPrograms(false);
    }

    // Local fallback recovery
    let savedLocal: Program[] = [];
    try {
      const stored = localStorage.getItem('su_programs');
      if (stored) savedLocal = JSON.parse(stored);
    } catch {}

    const finalPrograms = savedLocal.length > 0 ? savedLocal : [INITIAL_DEMO_PROGRAM];
    setPrograms(finalPrograms);
    if (!selectedProgramId && finalPrograms.length > 0) {
      setSelectedProgramId(finalPrograms[0].id);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // 2. Fetch data for selected program
  const fetchProgramData = async (progId: string) => {
    if (!progId) return;
    setLoadingData(true);
    try {
      // Parallel fetch
      const [tokensRes, respRes, statsRes, analysisRes] = await Promise.all([
        fetch(`/api/admin/tokens/${progId}`).then((r) => (r.ok ? r.json() : { tokens: [] })),
        fetch(`/api/admin/responses/${progId}`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/admin/dashboard/${progId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/admin/analysis/${progId}`).then(async (r) => (r.ok ? r.json() : null)),
      ]);

      if (tokensRes?.tokens && tokensRes.tokens.length > 0) {
        setTokens(tokensRes.tokens);
      } else if (progId === DEMO_PROGRAM_ID) {
        setTokens(generateInitialDemoTokens());
      } else {
        // Try local tokens
        try {
          const storedTokens = localStorage.getItem(`su_tokens_${progId}`);
          setTokens(storedTokens ? JSON.parse(storedTokens) : []);
        } catch {
          setTokens([]);
        }
      }

      if (Array.isArray(respRes) && respRes.length > 0) {
        setResponses(respRes);
      } else if (progId === DEMO_PROGRAM_ID) {
        setResponses(INITIAL_DEMO_RESPONSES);
      } else {
        setResponses([]);
      }

      if (statsRes) {
        setStats(statsRes);
      } else if (progId === DEMO_PROGRAM_ID) {
        setStats({
          totalResponses: INITIAL_DEMO_RESPONSES.length,
          avgRating: 4.4,
          tokensUsed: 25,
          tokensRemaining: 75,
          totalTokens: 100,
          participationRate: 25,
          topImprovementAreas: [
            { area: 'Logistik & Dewan', count: 18, percentage: 72 },
            { area: 'Pengurusan Masa & Tentatif', count: 15, percentage: 60 },
            { area: 'Makanan & Kebajikan Urusetia', count: 12, percentage: 48 },
            { area: 'Komunikasi & Arahan Ketua', count: 10, percentage: 40 },
          ],
        });
      } else {
        setStats(null);
      }

      if (analysisRes) {
        setAnalysis(analysisRes);
      } else if (progId === DEMO_PROGRAM_ID) {
        setAnalysis(INITIAL_DEMO_AI_ANALYSIS);
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      console.warn('Failed to fetch program data from server, applying local fallback:', err);
      if (progId === DEMO_PROGRAM_ID) {
        setTokens(generateInitialDemoTokens());
        setResponses(INITIAL_DEMO_RESPONSES);
        setAnalysis(INITIAL_DEMO_AI_ANALYSIS);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedProgramId) {
      fetchProgramData(selectedProgramId);
    }
  }, [selectedProgramId]);

  // Handle program status change
  const handleUpdateProgramStatus = async (newStatus: ProgramStatus) => {
    if (!activeProgram) return;

    // Update locally first so UI responds immediately
    const updatedProg: Program = { ...activeProgram, status: newStatus };
    setPrograms((prev) => {
      const next = prev.map((p) => (p.id === activeProgram.id ? updatedProg : p));
      try {
        localStorage.setItem('su_programs', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/admin/programs/${activeProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Server status update failed, kept local state', e);
    }
  };

  // Create Program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !newProgramDate) return;
    setCreatingProgram(true);

    const tempId = `prog-${Date.now()}`;
    const newProg: Program = {
      id: tempId,
      name: newProgramName.trim(),
      date: newProgramDate.trim(),
      location: newProgramLocation.trim(),
      description: newProgramDesc.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProg),
      });
      if (res.ok) {
        const created: Program = await res.json();
        setPrograms((prev) => {
          const next = [created, ...prev.filter((p) => p.id !== tempId)];
          try {
            localStorage.setItem('su_programs', JSON.stringify(next));
          } catch {}
          return next;
        });
        setSelectedProgramId(created.id);
      } else {
        // Fallback local
        setPrograms((prev) => {
          const next = [newProg, ...prev];
          try {
            localStorage.setItem('su_programs', JSON.stringify(next));
          } catch {}
          return next;
        });
        setSelectedProgramId(tempId);
      }
    } catch (e) {
      console.warn('Error creating program on server, saved locally:', e);
      setPrograms((prev) => {
        const next = [newProg, ...prev];
        try {
          localStorage.setItem('su_programs', JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedProgramId(tempId);
    } finally {
      setShowCreateProgramModal(false);
      setNewProgramName('');
      setNewProgramDate('');
      setNewProgramLocation('');
      setNewProgramDesc('');
      setCreatingProgram(false);
    }
  };

  // Delete Program
  const handleDeleteProgram = async () => {
    if (!programToDelete || deletingProgram) return;
    setDeletingProgram(true);
    setDeleteErrorMsg(null);

    const remaining = programs.filter((p) => p.id !== programToDelete.id);
    setPrograms(remaining);
    try {
      localStorage.setItem('su_programs', JSON.stringify(remaining));
    } catch {}

    if (selectedProgramId === programToDelete.id) {
      if (remaining.length > 0) {
        setSelectedProgramId(remaining[0].id);
      } else {
        setSelectedProgramId('');
        setTokens([]);
        setResponses([]);
        setStats(null);
        setAnalysis(null);
      }
    }

    try {
      await fetch(`/api/admin/programs/${programToDelete.id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Server delete call failed, deleted locally', e);
    } finally {
      setProgramToDelete(null);
      setDeletingProgram(false);
    }
  };

  // Generate Tokens
  const handleGenerateTokens = async () => {
    if (!activeProgram || generatingTokens) return;
    setGeneratingTokens(true);
    setTokenSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/tokens/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: activeProgram.id,
          count: tokenCountToGen,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTokenSuccessMsg(`✅ Berjaya menjana ${data.generatedCount} kod akses baharu.`);
        fetchProgramData(activeProgram.id);
        return;
      }
      throw new Error('Server returned error');
    } catch (e) {
      console.warn('Server token generation failed, generating locally:', e);
      // Local fallback token generation
      const newTokens: AccessToken[] = [];
      for (let i = 0; i < tokenCountToGen; i++) {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        newTokens.push({
          id: `token-${Date.now()}-${i}`,
          programId: activeProgram.id,
          code,
          status: 'UNUSED',
          createdAt: new Date().toISOString(),
        });
      }
      setTokens((prev) => {
        const combined = [...newTokens, ...prev];
        try {
          localStorage.setItem(`su_tokens_${activeProgram.id}`, JSON.stringify(combined));
        } catch {}
        return combined;
      });
      setTokenSuccessMsg(`✅ Berjaya menjana ${tokenCountToGen} kod akses baharu secara tempatan.`);
    } finally {
      setGeneratingTokens(false);
    }
  };

  // Run AI Analysis (Gemini)
  const handleRunAIAnalysis = async () => {
    if (!activeProgram || analyzingWithAI) return;
    setAnalyzingWithAI(true);
    setAiErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/ai-analyze/${activeProgram.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to demo analysis if active program is demo or analysis failed
        if (activeProgram.id === DEMO_PROGRAM_ID) {
          setAnalysis(INITIAL_DEMO_AI_ANALYSIS);
          return;
        }
        setAiErrorMsg(data.error || 'Gagal menjalankan analisis AI.');
        return;
      }
      setAnalysis(data);
    } catch {
      if (activeProgram.id === DEMO_PROGRAM_ID) {
        setAnalysis(INITIAL_DEMO_AI_ANALYSIS);
      } else {
        setAiErrorMsg('Rangkaian bermasalah semasa menganalisis dengan Gemini.');
      }
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    try {
      await fetch('/api/admin/reset-demo', { method: 'POST' });
      setResetSuccessMsg('✅ Data demo berjaya diset semula dengan 25 respons realistik.');
      await fetchPrograms();
      if (selectedProgramId) {
        await fetchProgramData(selectedProgramId);
      }
    } catch (e) {
      console.error('Error resetting demo', e);
    }
  };

  // Filtered responses for Feedback explorer
  const filteredResponses = responses.filter((r) => {
    if (ratingFilter !== 'ALL' && r.rating !== ratingFilter) return false;
    if (areaFilter !== 'ALL' && !r.answers.areasToImprove.includes(areaFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = [
        r.answers.strengths,
        r.answers.weaknesses,
        r.answers.unresolvedIssues,
        r.answers.blockingIssues,
        r.answers.doDifferently,
        r.answers.additionalComments,
      ]
        .join(' ')
        .toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      
      {/* Top Navigation */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Logo & Program Selector */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              SU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 leading-tight">SUARA URUSETIA</span>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  PENTADBIR
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Anonymous Post-Mortem Analytics</p>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Program Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                id="select-program"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none max-w-[200px] sm:max-w-[260px] truncate cursor-pointer"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </option>
                ))}
              </select>

              {activeProgram?.isDemo && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md shrink-0">
                  DEMO
                </span>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {activeProgram && (
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                {(['Draft', 'Active', 'Closed'] as ProgramStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateProgramStatus(st)}
                    className={`px-2.5 py-1 rounded-md transition text-xs ${
                      activeProgram.status === st
                        ? st === 'Active'
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : st === 'Closed'
                          ? 'bg-slate-700 text-white font-bold'
                          : 'bg-amber-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'Active' ? 'Aktif' : st === 'Closed' ? 'Tutup' : 'Draf'}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onViewRespondentPortal}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition"
            >
              Uji Portal Urusetia
            </button>

            <button
              onClick={onLogout}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition"
              title="Log Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto flex gap-1 border-t border-slate-200/80 pt-1 pb-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'programs', label: 'Program', icon: Calendar },
            { id: 'tokens', label: 'Kod Akses', icon: KeyRound },
            { id: 'feedback', label: 'Maklum Balas', icon: MessageSquare, count: responses.length },
            { id: 'ai', label: 'Analisis AI', icon: Sparkles },
            { id: 'report', label: 'Laporan Post-Mortem', icon: FileText },
            { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
            { id: 'settings', label: 'Tetapan', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border-b-2 border-teal-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-teal-200/70 text-teal-900' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Top 4 Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Jumlah Maklum Balas</span>
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalResponses || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Daripada responden anonymous</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Kadar Respon</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-3xl font-black text-emerald-700 mt-2">{stats?.responseRate || 0}%</p>
                <p className="text-xs text-slate-500 mt-1">{stats?.codesUsed || 0} daripada {stats?.totalCodes || 0} kod digunakan</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Purata Skor Kepuasan</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                </div>
                <p className="text-3xl font-black text-slate-900 mt-2">{stats?.averageRating || '0.0'} <span className="text-sm font-normal text-slate-400">/ 5.0</span></p>
                <p className="text-xs text-slate-500 mt-1">Berdasarkan 5 tahap rating</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Sentimen Positif</span>
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-3xl font-black text-teal-700 mt-2">{stats?.sentiment?.positive || 0}%</p>
                <p className="text-xs text-slate-500 mt-1">Neutral: {stats?.sentiment?.neutral || 0}% | Negatif: {stats?.sentiment?.negative || 0}%</p>
              </div>
            </div>

            {/* Middle Grid: Rating Distribution & Top Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Rating Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  <span>Taburan Penilaian Program (1 - 5 Bintang)</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = stats?.ratingDistribution?.[stars] || 0;
                    const pct = stats?.totalResponses ? Math.round((count / stats.totalResponses) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 w-16 font-bold text-slate-700 shrink-0">
                          <span>{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stars >= 4 ? 'bg-teal-600' : stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono font-semibold text-slate-700">
                          {count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Improvement Areas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Bahagian Paling Kerap Memerlukan Penambahbaikan</span>
                </h3>

                <div className="space-y-2.5 pt-2">
                  {(stats?.topIssues || []).slice(0, 5).map((item, idx) => {
                    const pct = stats?.totalResponses ? Math.round((item.count / stats.totalResponses) * 100) : 0;
                    return (
                      <div key={item.area} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-800">
                          <span>{idx + 1}. {item.area}</span>
                          <span className="font-mono text-slate-500">{item.count} undian ({pct}%)</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!stats?.topIssues || stats.topIssues.length === 0) && (
                    <p className="text-xs text-slate-400 py-4 text-center">Belum ada data undian bahagian.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Summary Card */}
            <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Analisis AI Siap Sedia</span>
                <h4 className="text-base font-bold text-slate-900">
                  {analysis ? 'Analisis Sintesis AI Terkini Telah Dijana' : 'Jana Analisis Pintar AI Sekarang'}
                </h4>
                <p className="text-xs text-slate-600 max-w-2xl">
                  {analysis?.overallSummary || 'Kecerdasan AI Gemini akan mengumpulkan isu berulang, sentimen urusetia, dan membina pelan tindakan secara automatik.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('ai')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Buka Analisis AI</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: PROGRAM */}
        {activeTab === 'programs' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pengurusan Program</h3>
                <p className="text-xs text-slate-500">Cipta, ubah status, dan pantau program post-mortem.</p>
              </div>
              <button
                id="btn-create-program"
                onClick={() => setShowCreateProgramModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cipta Program Baharu</span>
              </button>
            </div>

            {/* Program Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((p) => {
                const isSelected = p.id === selectedProgramId;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl border p-5 space-y-4 transition flex flex-col justify-between ${
                      isSelected ? 'border-teal-600 ring-2 ring-teal-600/15 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Closed'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'Active' ? 'Aktif' : p.status === 'Closed' ? 'Tutup' : 'Draf'}
                        </span>
                        {p.isDemo && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            DEMO DATA
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'Tiada keterangan.'}</p>
                      
                      <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{p.date}</span>
                        </p>
                        {p.location && (
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{p.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedProgramId(p.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Sedang Dipilih' : 'Pilih Program Ini'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteErrorMsg(null);
                          setProgramToDelete(p);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Padam Program"
                        aria-label="Padam Program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACCESS CODES */}
        {activeTab === 'tokens' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pengurusan Kod Akses 4 Digit</h3>
                <p className="text-xs text-slate-500">
                  Program: <span className="font-semibold text-slate-800">{activeProgram?.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-print-a4-slips"
                  onClick={() => setShowPrintModal(true)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-teal-600" />
                  <span>Cetak Slip A4</span>
                </button>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={tokenCountToGen}
                    onChange={(e) => setTokenCountToGen(Number(e.target.value))}
                    className="w-16 text-center text-xs font-bold border border-slate-300 rounded-lg py-1 outline-none"
                  />
                  <button
                    id="btn-generate-tokens"
                    onClick={handleGenerateTokens}
                    disabled={generatingTokens}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {generatingTokens ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Jana Kod</span>
                  </button>
                </div>
              </div>
            </div>

            {tokenSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl p-3.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{tokenSuccessMsg}</span>
              </div>
            )}

            {/* Token Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-slate-500 font-bold uppercase">Jumlah Kod Dijana</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{tokens.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-emerald-600 font-bold uppercase">Telah Digunakan (USED)</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{tokens.filter((t) => t.status === 'USED').length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <span className="text-xs text-teal-600 font-bold uppercase">Belum Digunakan (UNUSED)</span>
                <p className="text-2xl font-black text-teal-700 mt-1">{tokens.filter((t) => t.status === 'UNUSED').length}</p>
              </div>
            </div>

            {/* Privacy Compliance Banner */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Jaminan Integriti Anonim:</strong> Pangkalan data memisahkan rekod kod akses daripada respon borang secara kekal. Tiada sesiapa (termasuk pentadbir) boleh memautkan kod tertentu kepada respon tertentu.
              </span>
            </div>

            {/* Tokens Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Senarai Kod Akses Semasa ({tokens.length})</h4>
              </div>
              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-3">Bil</th>
                      <th className="p-3">Kod 4 Digit</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Tarikh Dijana</th>
                      <th className="p-3">Tarikh Digunakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {tokens.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-base text-slate-900 tracking-wider">{t.code}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'USED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString('ms-MY')}</td>
                        <td className="p-3 text-slate-500">
                          {t.usedAt ? new Date(t.usedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                    {tokens.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-slate-400">
                          Belum ada kod dijana untuk program ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAKLUM BALAS EXPLORER */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filter controls */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Cari kata kunci komen (contoh: walkie-talkie, pendaftaran, makanan, protokol)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="ALL">Semua Rating (1 - 5)</option>
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Bintang Sahaja</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Bintang Sahaja</option>
                    <option value={3}>⭐⭐⭐ 3 Bintang Sahaja</option>
                    <option value={2}>⭐⭐ 2 Bintang Sahaja</option>
                    <option value={1}>⭐ 1 Bintang Sahaja</option>
                  </select>
                </div>
              </div>

              {/* Area pills filter */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Bahagian:</span>
                {[
                  'ALL',
                  'Pendaftaran',
                  'Komunikasi',
                  'Masa / jadual',
                  'Logistik',
                  'Teknikal / PA System',
                  'Pengurusan urusetia',
                  'Makanan',
                ].map((area) => (
                  <button
                    key={area}
                    onClick={() => setAreaFilter(area)}
                    className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                      areaFilter === area
                        ? 'bg-teal-600 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {area === 'ALL' ? 'Semua Bahagian' : area}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>Menunjukkan <strong>{filteredResponses.length}</strong> maklum balas</span>
            </div>

            {/* Response Cards */}
            <div className="space-y-4">
              {filteredResponses.map((r, index) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  
                  {/* Top card metadata */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Respon #{index + 1}
                      </span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('ms-MY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Areas tagged */}
                  {r.answers.areasToImprove?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.answers.areasToImprove.map((area) => (
                        <span key={area} className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Q & A rows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-800">
                    {r.answers.strengths && (
                      <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
                          ✓ Berjalan Dengan Baik
                        </span>
                        <p className="text-slate-800">{r.answers.strengths}</p>
                      </div>
                    )}

                    {r.answers.weaknesses && (
                      <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                        <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">
                          ! Kelemahan Utama
                        </span>
                        <p className="text-slate-800">{r.answers.weaknesses}</p>
                      </div>
                    )}

                    {r.answers.blockingIssues && (
                      <div className="bg-rose-50/30 p-3 rounded-xl border border-rose-100">
                        <span className="text-[11px] font-bold text-rose-800 uppercase block mb-1">
                          ✕ Gangguan Kelancaran Tugas
                        </span>
                        <p className="text-slate-800">{r.answers.blockingIssues}</p>
                      </div>
                    )}

                    {r.answers.doDifferently && (
                      <div className="bg-teal-50/30 p-3 rounded-xl border border-teal-100">
                        <span className="text-[11px] font-bold text-teal-800 uppercase block mb-1">
                          💡 Cara Berbeza Program Akan Datang
                        </span>
                        <p className="text-slate-800">{r.answers.doDifferently}</p>
                      </div>
                    )}
                  </div>

                  {r.answers.additionalComments && (
                    <div className="pt-2 text-xs text-slate-600 italic border-t border-slate-100">
                      " {r.answers.additionalComments} "
                    </div>
                  )}

                </div>
              ))}

              {filteredResponses.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
                  Tiada maklum balas sepadan dengan penapis yang dipilih.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AI ANALYSIS */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header trigger */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">Analisis Kecerdasan Buatan (Gemini AI)</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Menganalisis {responses.length} maklum balas secara mendalam untuk mengenal pasti corak semantik, isu berulang, dan cadangan tindakan.
                </p>
              </div>

              <button
                id="btn-run-ai-analysis"
                onClick={handleRunAIAnalysis}
                disabled={analyzingWithAI || responses.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer ${
                  analyzingWithAI
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-700/20 active:scale-[0.99]'
                }`}
              >
                {analyzingWithAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini Sedang Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>JANA ANALISIS AI (GEMINI)</span>
                  </>
                )}
              </button>
            </div>

            {aiErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl p-3.5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiErrorMsg}</span>
              </div>
            )}

            {analysis ? (
              <div className="space-y-6">
                
                {/* 1. Rumusan Keseluruhan */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-teal-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Rumusan Keseluruhan Program</span>
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {analysis.overallSummary}
                  </p>
                </div>

                {/* 2. Sentimen Urusetia */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Indeks Sentimen Responden
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Positif</span>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{analysis.sentiment.positive}%</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <span className="text-xs font-bold text-slate-600 uppercase">Neutral</span>
                      <p className="text-2xl font-black text-slate-700 mt-1">{analysis.sentiment.neutral}%</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                      <span className="text-xs font-bold text-rose-800 uppercase">Negatif</span>
                      <p className="text-2xl font-black text-rose-700 mt-1">{analysis.sentiment.negative}%</p>
                    </div>
                  </div>
                </div>

                {/* 3. Strengths & Weaknesses 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strengths */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Kekuatan Program (Strengths)</span>
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                      {analysis.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Kelemahan Utama (Weaknesses)</span>
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                      {analysis.mainWeaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100">
                          <span className="text-amber-600 font-bold">!</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* 4. Semantic Issue Grouping (Mandatory spec feature) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Isu Berulang (Semantic Issue Grouping)
                      </h4>
                      <p className="text-xs text-slate-500">
                        AI mengelompokkan masalah dengan maksud serupa daripada perkataan responden yang berbeza.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.recurringIssues.map((issue, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            {issue.category}
                          </span>
                          <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            {issue.frequency} Respon
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{issue.summary}</p>
                        
                        {issue.sampleQuotes?.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Petikan Anonymous:</span>
                            {issue.sampleQuotes.map((q, qIdx) => (
                              <p key={qIdx} className="text-[11px] italic text-slate-600 bg-white p-2 rounded border border-slate-200">
                                "{q}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Critical Issues */}
                {analysis.criticalIssues?.length > 0 && (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>Isu Kritikal Berimpak Tinggi</span>
                    </h4>
                    <div className="space-y-2">
                      {analysis.criticalIssues.map((crit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-950 font-medium">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{crit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Action Plan Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Jadual Pelan Tindakan (Action Plan)
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="p-3">Isu</th>
                          <th className="p-3">Punca / Pemerhatian</th>
                          <th className="p-3">Cadangan Tindakan</th>
                          <th className="p-3 text-center">Keutamaan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysis.actionPlan.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{row.issue}</td>
                            <td className="p-3 text-slate-700">{row.causeOrObservation}</td>
                            <td className="p-3 text-slate-800">{row.proposedAction}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.priority === 'Tinggi'
                                    ? 'bg-rose-100 text-rose-800'
                                    : row.priority === 'Sederhana'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {row.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-teal-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Belum Ada Analisis AI</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tekan butang "Jana Analisis AI (Gemini)" di atas untuk memproses semua maklum balas urusetia secara automatik.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LAPORAN POST-MORTEM */}
        {activeTab === 'report' && activeProgram && (
          <div className="animate-in fade-in">
            <PostMortemReportView
              program={activeProgram}
              analysis={analysis}
              responses={responses}
              totalCodes={tokens.length}
            />
          </div>
        )}

        {/* TAB: GOOGLE SHEETS (PILIHAN 1: WEBHOOK) */}
        {activeTab === 'sheets' && (
          <GoogleSheetsView
            programs={programs}
            selectedProgramId={selectedProgramId}
            responses={responses}
          />
        )}

        {/* TAB 7: TETAPAN / SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in max-w-3xl">
            {/* Quick Google Sheets Link Card */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Integrasi Google Sheets (Pilihan 1)</h4>
                  <p className="text-xs text-slate-500">
                    Konfigurasikan Webhook Google Apps Script dan segerakkan data maklum balas secara live.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('sheets')}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <span>Buka Google Sheets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Tetapan Data & Privasi Sistem</h3>
              
              <div className="pt-2 space-y-4">
                {/* Reset Demo */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Set Semula Data Demo 2026</h4>
                    <p className="text-xs text-slate-500">
                      Muat semula 25 maklum balas realistik Bahasa Melayu untuk demo dashboard & laporan.
                    </p>
                  </div>
                  <button
                    onClick={handleResetDemo}
                    className="text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Set Semula Demo</span>
                  </button>
                </div>

                {resetSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Architecture Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-teal-800">
                Pemeriksaan Integriti Privasi (Zero-Trust Privacy Audit)
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Tiada pengumpulan Nama, Email, Nombor Telefon, atau No. Kad Pengenalan.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Kod akses 4 digit dinyahaktifkan secara kekal (USED) selepas sekali hantar.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Tiada foreign key atau pautan antara jadual token dan jadual respon borang.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Anti-duplicate kunci peranti disimpan berasingan dan tidak dipautkan dengan kandungan komen.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* CREATE PROGRAM MODAL */}
      {showCreateProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative">
            <button
              onClick={() => setShowCreateProgramModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Cipta Program Post-Mortem Baharu</h3>

            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Program <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sambutan Hari Sukan Negara Peringkat Negeri 2026"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarikh Program <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 24 Oktober 2026"
                    value={newProgramDate}
                    onChange={(e) => setNewProgramDate(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lokasi / Venue
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Stadium Nasional Bukit Jalil"
                    value={newProgramLocation}
                    onChange={(e) => setNewProgramLocation(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan Ringkas
                </label>
                <textarea
                  rows={3}
                  placeholder="Keterangan mengenai program atau skop tugas urusetia..."
                  value={newProgramDesc}
                  onChange={(e) => setNewProgramDesc(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProgramModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingProgram}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {creatingProgram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Simpan Program</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE TOKENS MODAL */}
      <PrintableTokensModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        program={activeProgram}
        tokens={tokens}
      />

      {/* CONFIRM DELETE PROGRAM MODAL */}
      {programToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Padam Program?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tindakan ini akan memadam program <strong className="text-slate-800">"{programToDelete.name}"</strong> berserta semua kod akses, respon maklum balas, dan analisis AI berkaitan.
                </p>
              </div>
            </div>

            {deleteErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {deleteErrorMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingProgram}
                onClick={() => {
                  setProgramToDelete(null);
                  setDeleteErrorMsg(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingProgram}
                onClick={handleDeleteProgram}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingProgram ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deletingProgram ? 'Memadam...' : 'Ya, Padam Program'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
