export type ProgramStatus = 'Draft' | 'Active' | 'Closed';

export interface Program {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: ProgramStatus;
  createdAt: string;
  isDemo?: boolean;
}

export type TokenStatus = 'UNUSED' | 'USED';

export interface AccessToken {
  id: string;
  programId: string;
  code: string; // 4 digits e.g. "3847"
  status: TokenStatus;
  createdAt: string;
  usedAt?: string;
}

export interface FeedbackResponse {
  id: string;
  programId: string;
  rating: number; // 1 - 5
  answers: {
    strengths: string; // Q2: perkara berjalan baik
    weaknesses: string; // Q3: kelemahan paling ketara
    areasToImprove: string[]; // Q4: bahagian memerlukan penambahbaikan
    unresolvedIssues: string; // Q5: masalah tidak sempat diselesaikan
    blockingIssues: string; // Q6: masalah mengganggu kelancaran tugas
    doDifferently: string; // Q7: apa patut dibuat berbeza
    changeOneThing: string; // Q8: ubah satu perkara sahaja
    mustRetain: string; // Q9: wajib dikekalkan
    additionalComments: string; // Q10: komen lain
  };
  createdAt: string;
}

export interface ActionPlanItem {
  issue: string; // Isu
  causeOrObservation: string; // Punca / Pemerhatian
  proposedAction: string; // Cadangan Tindakan
  priority: 'Tinggi' | 'Sederhana' | 'Rendah'; // Keutamaan
}

export interface SemanticIssueGroup {
  category: string; // e.g. "KOMUNIKASI & PENYELARASAN"
  frequency: number; // e.g. 15 responses
  summary: string; // Ringkasan issue
  sampleQuotes: string[]; // Contoh komen anonymous
}

export interface AIAnalysisResult {
  programId: string;
  analyzedAt: string;
  totalResponsesAnalyzed: number;
  overallSummary: string; // Rumusan Keseluruhan
  strengths: string[]; // Kekuatan Program
  mainWeaknesses: string[]; // Kelemahan Utama
  recurringIssues: SemanticIssueGroup[]; // Isu Berulang & Semantic Grouping
  criticalIssues: string[]; // Isu Kritikal
  recommendations: string[]; // Cadangan Penambahbaikan
  actionPlan: ActionPlanItem[]; // Jadual Tindakan
  sentiment: {
    positive: number; // % Positif
    neutral: number; // % Neutral
    negative: number; // % Negatif
  };
  anonymousQuotes: string[]; // Petikan komen terpilih
}

export interface PostMortemReport {
  id: string;
  programId: string;
  generatedAt: string;
  programInfo: {
    name: string;
    date: string;
    location: string;
    description: string;
  };
  executiveSummary: string;
  totalRespondents: number;
  responseRatePercent: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  topAreasToImprove: { area: string; count: number }[];
  aiAnalysis: AIAnalysisResult;
}

export interface DashboardStats {
  totalResponses: number;
  totalCodes: number;
  codesUsed: number;
  codesUnused: number;
  responseRate: number; // e.g. 87%
  averageRating: number; // e.g. 3.8
  ratingDistribution: Record<number, number>;
  topIssues: { area: string; count: number }[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface GoogleSheetsSettings {
  webhookUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncMessage?: string;
}
