import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Program,
  AccessToken,
  FeedbackResponse,
  AIAnalysisResult,
  PostMortemReport,
  DashboardStats,
  GoogleSheetsSettings
} from './src/types';
import {
  DEMO_PROGRAM_ID,
  INITIAL_DEMO_PROGRAM,
  generateInitialDemoTokens,
  INITIAL_DEMO_RESPONSES,
  INITIAL_DEMO_AI_ANALYSIS
} from './src/demoData';

// Global uncaught process listeners to prevent container crash loops
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check endpoints for Google Cloud Run container readiness & liveness probes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Persistent store directory (Use /tmp when running on Vercel serverless)
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  programs: Program[];
  accessTokens: AccessToken[];
  responses: FeedbackResponse[];
  analysis: Record<string, AIAnalysisResult>;
  browserLocks: { programId: string; browserId: string; lockedAt: string }[];
  googleSheetsSettings?: GoogleSheetsSettings;
}

// In-memory state cache (pre-seeded with demo data so memory is always ready)
let dbState: DatabaseSchema = {
  programs: [INITIAL_DEMO_PROGRAM],
  accessTokens: generateInitialDemoTokens(),
  responses: [...INITIAL_DEMO_RESPONSES],
  analysis: {
    [DEMO_PROGRAM_ID]: INITIAL_DEMO_AI_ANALYSIS,
  },
  browserLocks: [],
  googleSheetsSettings: {
    webhookUrl: '',
    autoSync: true,
    lastSyncStatus: 'idle',
  },
};

// Initialize or load DB safely
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.programs) && parsed.programs.length > 0) {
        dbState = parsed;
        if (!dbState.googleSheetsSettings) {
          dbState.googleSheetsSettings = {
            webhookUrl: '',
            autoSync: true,
            lastSyncStatus: 'idle',
          };
        }
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.warn('Filesystem access read-only or unavailable; continuing in-memory:', err);
  }

  // Ensure demo program exists if array is empty
  if (!dbState.programs || dbState.programs.length === 0) {
    seedDemoData();
  }
}

function seedDemoData() {
  const currentSheetsSettings = dbState.googleSheetsSettings || {
    webhookUrl: '',
    autoSync: true,
    lastSyncStatus: 'idle',
  };

  dbState = {
    programs: [INITIAL_DEMO_PROGRAM],
    accessTokens: generateInitialDemoTokens(),
    responses: [...INITIAL_DEMO_RESPONSES],
    analysis: {
      [DEMO_PROGRAM_ID]: INITIAL_DEMO_AI_ANALYSIS,
    },
    browserLocks: [],
    googleSheetsSettings: currentSheetsSettings,
  };
  saveDatabase();
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Note: Could not persist to disk, running in-memory mode:', err);
  }
}

initDatabase();

// In-memory Mutex to prevent race conditions on concurrent token redemptions
class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

const tokenMutex = new Mutex();

// Gemini client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// PUBLIC / RESPONDENT APIS (STRICTLY ANONYMOUS)
// ----------------------------------------------------

// 1. Get active program for respondents
app.get('/api/programs/active', (req: Request, res: Response) => {
  const activeProgram = dbState.programs.find((p) => p.status === 'Active') || dbState.programs[0];
  if (!activeProgram) {
    return res.status(404).json({ error: 'Tiada program aktif ditemui.' });
  }
  res.json({
    id: activeProgram.id,
    name: activeProgram.name,
    date: activeProgram.date,
    location: activeProgram.location,
    description: activeProgram.description,
    status: activeProgram.status,
    isDemo: !!activeProgram.isDemo,
  });
});

// 2. Validate 4-digit code (checks validity, unused status, and browser lock)
app.post('/api/token/validate', async (req: Request, res: Response) => {
  const release = await tokenMutex.acquire();
  try {
    const { programId, code, browserId } = req.body;

    if (!code || typeof code !== 'string' || !/^\d{4}$/.test(code.trim())) {
      return res.status(400).json({ valid: false, message: '❌ Kod akses tidak sah. Sila masukkan 4 digit nombor sahaja.' });
    }

    const cleanCode = code.trim();

    // Check program status
    const program = dbState.programs.find((p) => p.id === programId);
    if (!program) {
      return res.status(404).json({ valid: false, message: 'Program tidak ditemui.' });
    }
    if (program.status === 'Closed') {
      return res.status(400).json({ valid: false, message: '⚠️ Program ini telah ditutup dan tidak lagi menerima maklum balas.' });
    }

    // Check browser lock (device anti-duplicate)
    if (browserId) {
      const alreadySubmitted = dbState.browserLocks.some(
        (b) => b.programId === programId && b.browserId === browserId
      );
      if (alreadySubmitted) {
        return res.status(403).json({
          valid: false,
          isBrowserLocked: true,
          message: 'Maklum balas daripada peranti ini telah dihantar.',
        });
      }
    }

    // Check token existence and status
    const token = dbState.accessTokens.find(
      (t) => t.programId === programId && t.code === cleanCode
    );

    if (!token) {
      return res.status(404).json({ valid: false, message: '❌ Kod akses tidak sah.' });
    }

    if (token.status === 'USED') {
      return res.status(400).json({ valid: false, message: '⚠️ Kod ini telah digunakan.' });
    }

    return res.json({
      valid: true,
      message: '✅ Kod diterima.',
      programId: program.id,
      programName: program.name,
    });
  } finally {
    release();
  }
});

// Helper: Hantar maklum balas ke Google Sheets melalui Apps Script Webhook
async function forwardFeedbackToGoogleSheets(response: FeedbackResponse, programName: string) {
  const settings = dbState.googleSheetsSettings;
  if (!settings?.webhookUrl || !settings.webhookUrl.trim() || !settings.autoSync) {
    return;
  }

  try {
    const payload = {
      type: 'FEEDBACK',
      timestamp: new Date(response.createdAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
      responseId: response.id,
      programName: programName,
      rating: response.rating,
      areasToImprove: response.answers.areasToImprove || [],
      strengths: response.answers.strengths || '',
      weaknesses: response.answers.weaknesses || '',
      unresolvedIssues: response.answers.unresolvedIssues || '',
      blockingIssues: response.answers.blockingIssues || '',
      doDifferently: response.answers.doDifferently || '',
      changeOneThing: response.answers.changeOneThing || '',
      mustRetain: response.answers.mustRetain || '',
      additionalComments: response.answers.additionalComments || '',
    };

    const res = await fetch(settings.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (res.ok) {
      settings.lastSyncTime = new Date().toISOString();
      settings.lastSyncStatus = 'success';
      settings.lastSyncMessage = `Maklum balas berjaya disegerakkan pada ${new Date().toLocaleTimeString('ms-MY')}`;
      saveDatabase();
    } else {
      settings.lastSyncStatus = 'error';
      settings.lastSyncMessage = `Ralat status HTTP: ${res.status}`;
      saveDatabase();
    }
  } catch (err: any) {
    console.warn('Gagal menghantar maklum balas ke Google Sheets webhook:', err?.message || err);
    if (settings) {
      settings.lastSyncStatus = 'error';
      settings.lastSyncMessage = err?.message || 'Ralat sambungan webhook';
      saveDatabase();
    }
  }
}

// Helper: Hantar program baharu ke Google Sheets ke tab "Senarai Program"
async function forwardProgramToGoogleSheets(program: Program, tokenCount: number = 0) {
  const settings = dbState.googleSheetsSettings;
  if (!settings?.webhookUrl || !settings.webhookUrl.trim() || !settings.autoSync) {
    return;
  }

  try {
    const payload = {
      type: 'PROGRAM',
      id: program.id,
      name: program.name,
      date: program.date,
      location: program.location || '-',
      description: program.description || '-',
      status: program.status,
      tokenCount: tokenCount || 0,
      createdAt: new Date(program.createdAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
    };

    const res = await fetch(settings.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (res.ok) {
      settings.lastSyncTime = new Date().toISOString();
      settings.lastSyncStatus = 'success';
      settings.lastSyncMessage = `Program "${program.name}" berjaya disimpan ke tab "Senarai Program" pada ${new Date().toLocaleTimeString('ms-MY')}`;
      saveDatabase();
    } else {
      settings.lastSyncStatus = 'error';
      settings.lastSyncMessage = `Ralat HTTP ${res.status} semasa menghantar program`;
      saveDatabase();
    }
  } catch (err: any) {
    console.warn('Gagal menghantar program ke Google Sheets:', err?.message || err);
    if (settings) {
      settings.lastSyncStatus = 'error';
      settings.lastSyncMessage = err?.message || 'Ralat sambungan Google Sheets';
      saveDatabase();
    }
  }
}

// 3. Submit anonymous feedback with atomic token lock and browser lock
// IMPORTANT PRIVACY RULE:
// The response record NEVER stores tokenId, code, browserId, or IP address.
app.post('/api/feedback/submit', async (req: Request, res: Response) => {
  const release = await tokenMutex.acquire();
  try {
    const { programId, code, browserId, rating, answers } = req.body;

    if (!programId || !code || !rating || !answers) {
      return res.status(400).json({ error: 'Data borang tidak lengkap.' });
    }

    const cleanCode = String(code).trim();
    if (!/^\d{4}$/.test(cleanCode)) {
      return res.status(400).json({ error: '❌ Kod akses tidak sah.' });
    }

    const program = dbState.programs.find((p) => p.id === programId);
    if (!program) {
      return res.status(404).json({ error: 'Program tidak ditemui.' });
    }
    if (program.status === 'Closed') {
      return res.status(400).json({ error: 'Program ini telah ditutup dan tidak lagi menerima maklum balas.' });
    }

    // Check browser lock
    if (browserId) {
      const alreadyLocked = dbState.browserLocks.some(
        (b) => b.programId === programId && b.browserId === browserId
      );
      if (alreadyLocked) {
        return res.status(403).json({ error: 'Maklum balas daripada peranti ini telah dihantar.' });
      }
    }

    // Find token and ensure UNUSED
    const tokenIndex = dbState.accessTokens.findIndex(
      (t) => t.programId === programId && t.code === cleanCode
    );

    if (tokenIndex === -1) {
      return res.status(404).json({ error: '❌ Kod akses tidak sah.' });
    }

    if (dbState.accessTokens[tokenIndex].status === 'USED') {
      return res.status(400).json({ error: '⚠️ Kod ini telah digunakan.' });
    }

    // 1. Mark token USED atomically
    dbState.accessTokens[tokenIndex].status = 'USED';
    dbState.accessTokens[tokenIndex].usedAt = new Date().toISOString();

    // 2. Record browser lock separately (NO relation to response)
    if (browserId) {
      dbState.browserLocks.push({
        programId,
        browserId,
        lockedAt: new Date().toISOString(),
      });
    }

    // 3. Save purely anonymous response (NO tokenId, NO browserId, NO IP)
    const newResponse: FeedbackResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      programId,
      rating: Number(rating),
      answers: {
        strengths: String(answers.strengths || '').trim(),
        weaknesses: String(answers.weaknesses || '').trim(),
        areasToImprove: Array.isArray(answers.areasToImprove) ? answers.areasToImprove : [],
        unresolvedIssues: String(answers.unresolvedIssues || '').trim(),
        blockingIssues: String(answers.blockingIssues || '').trim(),
        doDifferently: String(answers.doDifferently || '').trim(),
        changeOneThing: String(answers.changeOneThing || '').trim(),
        mustRetain: String(answers.mustRetain || '').trim(),
        additionalComments: String(answers.additionalComments || '').trim(),
      },
      createdAt: new Date().toISOString(),
    };

    dbState.responses.push(newResponse);
    saveDatabase();

    // Trigger auto-sync ke Google Sheets (tidak menyekat masa responden)
    forwardFeedbackToGoogleSheets(newResponse, program.name).catch((err) => {
      console.warn('Google Sheets auto-forward warning:', err);
    });

    return res.json({
      success: true,
      message: '✅ Maklum balas berjaya dihantar secara anonymous.',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Rangkaian bermasalah. Sila cuba lagi.' });
  } finally {
    release();
  }
});

// ----------------------------------------------------
// ADMIN APIS
// ----------------------------------------------------

// Admin credentials check (default administrative passcode: "suara2026" + Google Sheets "Akaun Pentadbir" verification)
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  // 1. Kunci Utama Kecemasan (Emergency Master Password - Sentiasa berfungsi)
  if ((cleanUser === 'admin' || cleanUser === 'urusetia') && cleanPass === 'suara2026') {
    return res.json({
      success: true,
      token: 'admin-session-' + Date.now(),
      user: { name: 'Pentadbir Suara Urusetia', role: 'Super Admin' },
      source: 'master',
    });
  }

  // 2. Semakan terus ke tab "Akaun Pentadbir" di Google Sheet (jika Webhook telah dikonfigurasikan)
  const webhookUrl = dbState.googleSheetsSettings?.webhookUrl?.trim();
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'AUTH_ADMIN',
          username: cleanUser,
          password: cleanPass,
        }),
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.status === 'success') {
          return res.json({
            success: true,
            token: 'admin-session-' + Date.now(),
            user: data.user || { name: cleanUser, role: 'admin' },
            source: 'google-sheet',
          });
        }
        if (data.message) {
          return res.status(401).json({ error: data.message });
        }
      }
    } catch (sheetErr) {
      console.warn('Google Sheets authentication check warning:', sheetErr);
    }
  }

  return res.status(401).json({ error: 'Kredensial log masuk tidak sah. Sila semak nama pengguna dan kata laluan.' });
});

// Programs List
app.get('/api/admin/programs', (req: Request, res: Response) => {
  res.json(dbState.programs);
});

// Create Program
app.post('/api/admin/programs', (req: Request, res: Response) => {
  const { name, date, location, description, status } = req.body;
  if (!name || !date) {
    return res.status(400).json({ error: 'Nama program dan tarikh wajib diisi.' });
  }
  const newProgram: Program = {
    id: `prog-${Date.now()}`,
    name: name.trim(),
    date: date.trim(),
    location: (location || '').trim(),
    description: (description || '').trim(),
    status: status === 'Active' || status === 'Closed' ? status : 'Draft',
    createdAt: new Date().toISOString(),
    isDemo: false,
  };
  dbState.programs.unshift(newProgram);
  saveDatabase();

  // Auto-sync program baru ke Google Sheets (Pilihan A: Tab Senarai Program)
  forwardProgramToGoogleSheets(newProgram, 0).catch((err) => {
    console.warn('Google Sheets program auto-forward warning:', err);
  });

  res.json(newProgram);
});

// Update Program Status / Details
app.put('/api/admin/programs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const program = dbState.programs.find((p) => p.id === id);
  if (!program) {
    return res.status(404).json({ error: 'Program tidak ditemui.' });
  }
  const { name, date, location, description, status } = req.body;
  if (name) program.name = name.trim();
  if (date) program.date = date.trim();
  if (location !== undefined) program.location = location.trim();
  if (description !== undefined) program.description = description.trim();
  if (status && ['Draft', 'Active', 'Closed'].includes(status)) {
    program.status = status;
  }
  saveDatabase();
  res.json(program);
});

// Delete Program and its associated tokens, responses, and locks
app.delete('/api/admin/programs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const programIndex = dbState.programs.findIndex((p) => p.id === id);
  if (programIndex === -1) {
    return res.status(404).json({ error: 'Program tidak ditemui.' });
  }

  const deletedProgram = dbState.programs[programIndex];

  // Remove program
  dbState.programs.splice(programIndex, 1);

  // Clean up associated tokens
  dbState.accessTokens = dbState.accessTokens.filter((t) => t.programId !== id);

  // Clean up associated responses
  dbState.responses = dbState.responses.filter((r) => r.programId !== id);

  // Clean up associated browser locks
  dbState.browserLocks = dbState.browserLocks.filter((b) => b.programId !== id);

  // Clean up associated AI analysis
  delete dbState.analysis[id];

  saveDatabase();

  res.json({
    success: true,
    message: `Program "${deletedProgram.name}" dan semua data berkaitannya berjaya dipadamkan.`,
    deletedId: id,
  });
});

// Generate Access Codes
app.post('/api/admin/tokens/generate', (req: Request, res: Response) => {
  const { programId, count } = req.body;
  const program = dbState.programs.find((p) => p.id === programId);
  if (!program) {
    return res.status(404).json({ error: 'Program tidak ditemui.' });
  }

  const requestedCount = Math.min(Math.max(Number(count) || 10, 1), 500);

  // Existing codes in this program
  const existingCodes = new Set(
    dbState.accessTokens.filter((t) => t.programId === programId).map((t) => t.code)
  );

  const newTokens: AccessToken[] = [];
  let attempts = 0;
  while (newTokens.length < requestedCount && attempts < 10000) {
    attempts++;
    // 4 digits: 0000 - 9999
    const raw = Math.floor(Math.random() * 10000);
    const code = String(raw).padStart(4, '0');

    if (!existingCodes.has(code)) {
      existingCodes.add(code);
      newTokens.push({
        id: `token-${Date.now()}-${newTokens.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
        programId,
        code,
        status: 'UNUSED',
        createdAt: new Date().toISOString(),
      });
    }
  }

  dbState.accessTokens.push(...newTokens);
  saveDatabase();

  res.json({
    message: `${newTokens.length} kod akses berjaya dijana.`,
    generatedCount: newTokens.length,
    tokens: newTokens,
  });
});

// Get Tokens for Program (STRICTLY WITHOUT RESPONSE LINK)
app.get('/api/admin/tokens/:programId', (req: Request, res: Response) => {
  const { programId } = req.params;
  const tokens = dbState.accessTokens.filter((t) => t.programId === programId);

  const total = tokens.length;
  const used = tokens.filter((t) => t.status === 'USED').length;
  const unused = total - used;

  res.json({
    total,
    used,
    unused,
    tokens,
  });
});

// Get Anonymous Responses (STRICTLY NO IDENTIFIERS)
app.get('/api/admin/responses/:programId', (req: Request, res: Response) => {
  const { programId } = req.params;
  const responses = dbState.responses.filter((r) => r.programId === programId);
  res.json(responses);
});

// Get Dashboard Aggregated Stats
app.get('/api/admin/dashboard/:programId', (req: Request, res: Response) => {
  const { programId } = req.params;
  const tokens = dbState.accessTokens.filter((t) => t.programId === programId);
  const responses = dbState.responses.filter((r) => r.programId === programId);

  const totalCodes = tokens.length;
  const codesUsed = tokens.filter((t) => t.status === 'USED').length;
  const codesUnused = totalCodes - codesUsed;
  const totalResponses = responses.length;
  const responseRate = totalCodes > 0 ? Math.round((codesUsed / totalCodes) * 100) : 0;

  const totalRating = responses.reduce((acc, r) => acc + (r.rating || 0), 0);
  const averageRating = totalResponses > 0 ? Number((totalRating / totalResponses).toFixed(1)) : 0;

  // Rating distribution 1 - 5
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  responses.forEach((r) => {
    if (ratingDistribution[r.rating] !== undefined) {
      ratingDistribution[r.rating]++;
    }
  });

  // Top issues frequency
  const issueCounts: Record<string, number> = {};
  responses.forEach((r) => {
    (r.answers?.areasToImprove || []).forEach((area) => {
      issueCounts[area] = (issueCounts[area] || 0) + 1;
    });
  });

  const topIssues = Object.entries(issueCounts)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  const existingAnalysis = dbState.analysis[programId];
  const sentiment = existingAnalysis?.sentiment || {
    positive: Math.round((responses.filter((r) => r.rating >= 4).length / Math.max(totalResponses, 1)) * 100),
    neutral: Math.round((responses.filter((r) => r.rating === 3).length / Math.max(totalResponses, 1)) * 100),
    negative: Math.round((responses.filter((r) => r.rating <= 2).length / Math.max(totalResponses, 1)) * 100),
  };

  const stats: DashboardStats = {
    totalResponses,
    totalCodes,
    codesUsed,
    codesUnused,
    responseRate,
    averageRating,
    ratingDistribution,
    topIssues,
    sentiment,
  };

  res.json(stats);
});

// AI ANALYSIS WITH GEMINI API (Server-Side)
app.post('/api/admin/ai-analyze/:programId', async (req: Request, res: Response) => {
  const { programId } = req.params;
  const responses = dbState.responses.filter((r) => r.programId === programId);
  const program = dbState.programs.find((p) => p.id === programId);

  if (!program) {
    return res.status(404).json({ error: 'Program tidak ditemui.' });
  }

  if (responses.length === 0) {
    return res.status(400).json({ error: 'Belum ada maklum balas diterima.' });
  }

  if (responses.length < 3) {
    return res.status(400).json({ error: 'Belum cukup maklum balas untuk analisis AI yang bermakna (minimum 3 respon).' });
  }

  const aiClient = getGeminiClient();

  // Prepare anonymized feedback text for AI analysis
  const responseDataSummary = responses.map((r, index) => ({
    respondenNum: index + 1,
    skorRating: r.rating,
    perkaraBaik: r.answers.strengths,
    kelemahan: r.answers.weaknesses,
    bahagianPenambahbaikan: r.answers.areasToImprove,
    masalahTakSelesai: r.answers.unresolvedIssues,
    masalahGangguTugas: r.answers.blockingIssues,
    buatBerbeza: r.answers.doDifferently,
    ubahSatuPerkara: r.answers.changeOneThing,
    wajibKekal: r.answers.mustRetain,
    komenTambahan: r.answers.additionalComments,
  }));

  if (aiClient) {
    try {
      const prompt = `Anda adalah Pakar Analisis Pasca-Nilai (Lead Post-Mortem & Operations Analyst) profesional untuk acara dan program kerajaan/NGO di Malaysia.
Analisis semua maklum balas ANONYMOUS daripada urusetia program "${program.name}" (${program.date}, ${program.location}) berikut.

PENTING:
- Jangan cuba meneka identiti pemberi komen.
- Hanya analisis kandungan maklum balas secara objektif dalam Bahasa Melayu yang profesional, ringkas dan padat.
- Lakukan SEMANTIC ISSUE GROUPING: gabungkan komen-komen yang mempunyai maksud serupa (contoh: "Tak tahu nak rujuk siapa", "Arahan selalu berubah", "Info lambat sampai" dikumpulkan sebagai "KOMUNIKASI & PENYELARASAN ARAHAN").
- Kenal pasti isu kritikal dan cadangan tindakan (Action Plan) dengan keutamaan: "Tinggi", "Sederhana", atau "Rendah".
- Jangan reka fakta yang tiada dalam data maklum balas. Jika maklumat tidak mencukupi, nyatakan dengan jujur.

DATA MAKLUM BALAS URUSETIA:
${JSON.stringify(responseDataSummary, null, 2)}
`;

      const geminiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Anda adalah penganalisis laporan post-mortem profesional. Hasilkan output dalam format JSON sah mengikut skema yang ditetapkan.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSummary: { type: Type.STRING, description: 'Rumusan eksekutif keseluruhan program' },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Senarai kekuatan utama program'
              },
              mainWeaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Senarai kelemahan utama program'
              },
              recurringIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: 'Nama kategori isu (cth: KOMUNIKASI & PENYELARASAN)' },
                    frequency: { type: Type.INTEGER, description: 'Anggaran jumlah respon berkaitan' },
                    summary: { type: Type.STRING, description: 'Penerangan ringkas isu' },
                    sampleQuotes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Contoh komen anonymous daripada responden'
                    }
                  },
                  required: ['category', 'frequency', 'summary', 'sampleQuotes']
                }
              },
              criticalIssues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Isu paling kritikal yang menjejaskan perjalanan majlis'
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Cadangan penambahbaikan untuk masa hadapan'
              },
              actionPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    issue: { type: Type.STRING, description: 'Isu' },
                    causeOrObservation: { type: Type.STRING, description: 'Punca / Pemerhatian' },
                    proposedAction: { type: Type.STRING, description: 'Cadangan Tindakan Konkrit' },
                    priority: { type: Type.STRING, description: 'Tinggi, Sederhana, atau Rendah' }
                  },
                  required: ['issue', 'causeOrObservation', 'proposedAction', 'priority']
                }
              },
              sentiment: {
                type: Type.OBJECT,
                properties: {
                  positive: { type: Type.INTEGER, description: 'Peratusan sentimen positif (0-100)' },
                  neutral: { type: Type.INTEGER, description: 'Peratusan sentimen neutral (0-100)' },
                  negative: { type: Type.INTEGER, description: 'Peratusan sentimen negatif (0-100)' }
                },
                required: ['positive', 'neutral', 'negative']
              },
              anonymousQuotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Petikan komen anonymous yang paling berimpak'
              }
            },
            required: [
              'overallSummary',
              'strengths',
              'mainWeaknesses',
              'recurringIssues',
              'criticalIssues',
              'recommendations',
              'actionPlan',
              'sentiment',
              'anonymousQuotes'
            ]
          }
        }
      });

      const parsed = JSON.parse(geminiResponse.text || '{}');
      const analysisResult: AIAnalysisResult = {
        programId,
        analyzedAt: new Date().toISOString(),
        totalResponsesAnalyzed: responses.length,
        overallSummary: parsed.overallSummary || 'Analisis maklum balas urusetia program selesai.',
        strengths: parsed.strengths || [],
        mainWeaknesses: parsed.mainWeaknesses || [],
        recurringIssues: parsed.recurringIssues || [],
        criticalIssues: parsed.criticalIssues || [],
        recommendations: parsed.recommendations || [],
        actionPlan: parsed.actionPlan || [],
        sentiment: parsed.sentiment || { positive: 60, neutral: 25, negative: 15 },
        anonymousQuotes: parsed.anonymousQuotes || []
      };

      dbState.analysis[programId] = analysisResult;
      saveDatabase();
      return res.json(analysisResult);
    } catch (geminiError) {
      console.error('Gemini API call failed, falling back to heuristic synthesizer:', geminiError);
    }
  }

  // Fallback heuristic analysis if Gemini API is unavailable or offline
  const analysisResult = generateHeuristicAnalysis(program, responses);
  dbState.analysis[programId] = analysisResult;
  saveDatabase();
  return res.json(analysisResult);
});

// Get existing AI Analysis
app.get('/api/admin/analysis/:programId', (req: Request, res: Response) => {
  const { programId } = req.params;
  const analysis = dbState.analysis[programId];
  if (!analysis) {
    return res.status(404).json({ error: 'Belum ada analisis AI untuk program ini. Sila tekan butang Analisis dengan AI.' });
  }
  res.json(analysis);
});

// Reset Demo Data endpoint
app.post('/api/admin/reset-demo', (req: Request, res: Response) => {
  seedDemoData();
  res.json({ success: true, message: 'Data demo berjaya disetkan semula dengan 25 respon realistik.' });
});

// ----------------------------------------------------
// GOOGLE SHEETS INTEGRATION APIS (PILIHAN 1: WEBHOOK)
// ----------------------------------------------------

// Dapatkan konfigurasi Google Sheets
app.get('/api/admin/google-sheets', (req: Request, res: Response) => {
  const settings = dbState.googleSheetsSettings || {
    webhookUrl: '',
    autoSync: true,
    lastSyncStatus: 'idle',
  };
  res.json({ settings });
});

// Kemas kini konfigurasi Google Sheets
app.post('/api/admin/google-sheets', (req: Request, res: Response) => {
  const { webhookUrl, sheetUrl, autoSync } = req.body;
  
  if (!dbState.googleSheetsSettings) {
    dbState.googleSheetsSettings = {
      webhookUrl: '',
      sheetUrl: '',
      autoSync: true,
      lastSyncStatus: 'idle',
    };
  }

  dbState.googleSheetsSettings.webhookUrl = typeof webhookUrl === 'string' ? webhookUrl.trim() : '';
  if (typeof sheetUrl === 'string') {
    dbState.googleSheetsSettings.sheetUrl = sheetUrl.trim();
  }
  dbState.googleSheetsSettings.autoSync = autoSync !== undefined ? Boolean(autoSync) : true;
  saveDatabase();

  res.json({
    success: true,
    message: 'Tetapan Google Sheets berjaya disimpan.',
    settings: dbState.googleSheetsSettings,
  });
});

// Uji sambungan Webhook Google Sheets
app.post('/api/admin/google-sheets/test', async (req: Request, res: Response) => {
  const targetUrl = req.body.webhookUrl?.trim() || dbState.googleSheetsSettings?.webhookUrl?.trim();

  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      error: 'Sila masukkan URL Webhook Google Apps Script terlebih dahulu.',
    });
  }

  if (targetUrl.includes('docs.google.com/spreadsheets')) {
    return res.status(400).json({
      success: false,
      error: 'URL yang dimasukkan ialah URL fail Google Sheet (docs.google.com). Sila masukkan URL Web App Google Apps Script yang bermula dengan https://script.google.com/macros/s/.../exec.',
    });
  }

  try {
    const testPayload = {
      timestamp: new Date().toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
      responseId: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
      programName: 'UJIAN SAMBUNGAN - SUARA URUSETIA',
      rating: 5,
      areasToImprove: ['Logistik', 'Pengurusan Masa'],
      strengths: 'Sambungan webhook Google Sheets berfungsi dengan lancar!',
      weaknesses: 'Tiada kelemahan (Baris Ujian Sistem)',
      unresolvedIssues: 'Tiada isu tertunggak',
      blockingIssues: 'Tiada halangan',
      doDifferently: 'Sedia merekodkan maklum balas urusetia secara langsung',
      additionalComments: 'Ini adalah baris ujian automatik daripada panel pentadbir Suara Urusetia.',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testPayload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      if (dbState.googleSheetsSettings) {
        dbState.googleSheetsSettings.lastSyncTime = new Date().toISOString();
        dbState.googleSheetsSettings.lastSyncStatus = 'success';
        dbState.googleSheetsSettings.lastSyncMessage = 'Ujian sambungan berjaya';
        saveDatabase();
      }

      return res.json({
        success: true,
        message: '✅ Sambungan Berjaya! Satu baris ujian telah berjaya dimasukkan ke Google Sheet anda.',
      });
    } else {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Ralat HTTP 404: URL Webhook tidak wujud di Google Apps Script. Ini biasanya berlaku apabila anda membuat "New deployment" baru yang menghasilkan URL baharu. Sila buka Google Sheet > Extensions > Apps Script > Deploy > Manage deployments, salin "Web app URL" yang terkini dan simpan di Tetapan ini.',
        });
      }
      return res.status(response.status).json({
        success: false,
        error: `Google Apps Script mengembalikan status HTTP ${response.status}. Pastikan tetapan "Who has access" adalah "Anyone".`,
      });
    }
  } catch (err: any) {
    console.error('Ralat ujian Google Sheets webhook:', err);
    const isTimeout = err?.name === 'AbortError' || err?.code === 20;
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Masa sambungan tamat (Timeout 45s). Pelayan Google mengambil masa terlalu lama untuk membalas. Sila pastikan Webhook URL betul dan tetapan Deployment adalah "Anyone".'
        : `Ralat sambungan: ${err?.message || 'Tidak dapat menghubungi URL Google Apps Script. Pastikan URL betul.'}`,
    });
  }
});

// Cipta atau inisialisasi tab "Akaun Pentadbir" di Google Sheet
app.post('/api/admin/google-sheets/init-admin-tab', async (req: Request, res: Response) => {
  const targetUrl = req.body.webhookUrl?.trim() || dbState.googleSheetsSettings?.webhookUrl?.trim();

  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL Webhook Google Sheets belum dikonfigurasi. Sila masukkan Webhook URL terlebih dahulu.',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ type: 'INIT_ADMIN_TAB' }),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.json({
        success: true,
        message: data.message || '✅ Tab "Akaun Pentadbir" berjaya disahkan/dicipta di Google Sheet anda!',
      });
    } else {
      return res.status(response.status).json({
        success: false,
        error: `Google Apps Script membalas dengan ralat HTTP ${response.status}.`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Gagal menghubungi Google Apps Script: ${err?.message || 'Ralat sambungan'}`,
    });
  }
});

// Segerakkan maklum balas sedia ada ke Google Sheets (Single Program atau Semua)
app.post('/api/admin/google-sheets/sync-all', async (req: Request, res: Response) => {
  const targetUrl = req.body.webhookUrl?.trim() || dbState.googleSheetsSettings?.webhookUrl?.trim();
  const { programId } = req.body;

  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL Webhook Google Sheets belum dikonfigurasi.',
    });
  }

  if (targetUrl.includes('docs.google.com/spreadsheets')) {
    return res.status(400).json({
      success: false,
      error: 'URL yang dimasukkan ialah URL fail Google Sheet (docs.google.com). Sila masukkan URL Web App Google Apps Script yang bermula dengan https://script.google.com/macros/s/.../exec.',
    });
  }

  const responsesToSync = programId
    ? dbState.responses.filter((r) => r.programId === programId)
    : dbState.responses;

  if (responsesToSync.length === 0) {
    return res.json({
      success: true,
      count: 0,
      message: 'Tiada maklum balas untuk disegerakkan.',
    });
  }

  try {
    const items = responsesToSync.map((r) => {
      const prog = dbState.programs.find((p) => p.id === r.programId);
      return {
        timestamp: new Date(r.createdAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
        responseId: r.id,
        programName: prog ? prog.name : 'Program',
        rating: r.rating,
        areasToImprove: r.answers.areasToImprove || [],
        strengths: r.answers.strengths || '',
        weaknesses: r.answers.weaknesses || '',
        unresolvedIssues: r.answers.unresolvedIssues || '',
        blockingIssues: r.answers.blockingIssues || '',
        doDifferently: r.answers.doDifferently || '',
        changeOneThing: r.answers.changeOneThing || '',
        mustRetain: r.answers.mustRetain || '',
        additionalComments: r.answers.additionalComments || '',
      };
    });

    // Chunking to prevent Google Apps Script timeouts (5 items per request)
    const CHUNK_SIZE = 5;
    let successCount = 0;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ batch: true, items: chunk }),
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Ralat HTTP 404: URL Webhook tidak wujud di Google Apps Script. Kemungkinan anda membuat Deployment baharu yang mempunyai Web App URL berbeza. Sila salin Web App URL terkini dari Google Sheets (Deploy > Manage deployments) dan kemas kini di Tetapan Google Sheets.');
          }
          throw new Error(`Ralat HTTP ${response.status} daripada Google Apps Script.`);
        }
        successCount += chunk.length;
      } catch (chunkErr: any) {
        clearTimeout(timeoutId);
        throw chunkErr;
      }
    }

    if (dbState.googleSheetsSettings) {
      dbState.googleSheetsSettings.lastSyncTime = new Date().toISOString();
      dbState.googleSheetsSettings.lastSyncStatus = 'success';
      dbState.googleSheetsSettings.lastSyncMessage = `Disegerakkan ${successCount} rekod pada ${new Date().toLocaleTimeString('ms-MY')}`;
      saveDatabase();
    }

    return res.json({
      success: true,
      count: successCount,
      message: `✅ Berjaya menyegerakkan ${successCount} maklum balas ke dalam Google Sheet anda!`,
    });
  } catch (err: any) {
    console.error('Ralat penyegerakan kelompok Google Sheets:', err);
    const isTimeout = err?.name === 'AbortError' || err?.code === 20;
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Masa sambungan tamat (Timeout 45s). Google Apps Script mengambil masa terlalu lama untuk memproses baris data. Sila kemas kini kod Apps Script terkini (dengan setValues pantas) atau segerakkan mengikut program individu.'
        : `Gagal menyegerakkan: ${err?.message || 'Ralat sambungan'}`,
    });
  }
});

// Segerakkan semua senarai program ke Google Sheets (Tab "Senarai Program")
app.post('/api/admin/google-sheets/sync-programs', async (req: Request, res: Response) => {
  const targetUrl = req.body.webhookUrl?.trim() || dbState.googleSheetsSettings?.webhookUrl?.trim();

  if (!targetUrl) {
    return res.status(400).json({
      success: false,
      error: 'URL Webhook Google Sheets belum dikonfigurasi.',
    });
  }

  if (targetUrl.includes('docs.google.com/spreadsheets')) {
    return res.status(400).json({
      success: false,
      error: 'URL yang dimasukkan ialah URL fail Google Sheet (docs.google.com). Sila masukkan URL Web App Google Apps Script yang bermula dengan https://script.google.com/macros/s/.../exec.',
    });
  }

  const programs = dbState.programs.map((p) => {
    const tokenCount = dbState.accessTokens.filter((t) => t.programId === p.id).length;
    return {
      id: p.id,
      name: p.name,
      date: p.date,
      location: p.location || '-',
      description: p.description || '-',
      status: p.status,
      tokenCount,
      createdAt: new Date(p.createdAt).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' }),
    };
  });

  if (programs.length === 0) {
    return res.json({
      success: true,
      count: 0,
      message: 'Tiada program untuk disegerakkan.',
    });
  }

  try {
    // Chunking to prevent timeouts (10 programs per chunk)
    const CHUNK_SIZE = 10;
    let successCount = 0;

    for (let i = 0; i < programs.length; i += CHUNK_SIZE) {
      const chunk = programs.slice(i, i + CHUNK_SIZE);
      const isFirstChunk = i === 0;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500);

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            type: 'SYNC_PROGRAMS',
            programs: chunk,
            isFirstChunk,
          }),
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Ralat HTTP 404: URL Webhook tidak wujud di Google Apps Script. Kemungkinan anda membuat Deployment baharu yang mempunyai Web App URL berbeza. Sila salin Web App URL terkini dari Google Sheets (Deploy > Manage deployments) dan kemas kini di Tetapan Google Sheets.');
          }
          throw new Error(`Ralat HTTP ${response.status} semasa penyegerakan senarai program ke Google Sheets.`);
        }
        successCount += chunk.length;
      } catch (chunkErr: any) {
        clearTimeout(timeoutId);
        throw chunkErr;
      }
    }

    if (dbState.googleSheetsSettings) {
      dbState.googleSheetsSettings.lastSyncTime = new Date().toISOString();
      dbState.googleSheetsSettings.lastSyncStatus = 'success';
      dbState.googleSheetsSettings.lastSyncMessage = `Disegerakkan ${successCount} senarai program pada ${new Date().toLocaleTimeString('ms-MY')}`;
      saveDatabase();
    }

    return res.json({
      success: true,
      count: successCount,
      message: `✅ Berjaya menyegerakkan ${successCount} program ke tab "Senarai Program" di Google Sheet anda!`,
    });
  } catch (err: any) {
    console.error('Ralat penyegerakan senarai program Google Sheets:', err);
    const isTimeout = err?.name === 'AbortError' || err?.code === 20;
    return res.status(500).json({
      success: false,
      error: isTimeout
        ? 'Masa sambungan tamat (Timeout 45s). Google Apps Script mengambil masa terlalu lama untuk memproses senarai program. Sila cuba lagi sebentar.'
        : `Gagal menyegerakkan senarai program: ${err?.message || 'Ralat sambungan'}`,
    });
  }
});

// Heuristic fallback for analysis
function generateHeuristicAnalysis(program: Program, responses: FeedbackResponse[]): AIAnalysisResult {
  const total = responses.length;
  const ratings = responses.map((r) => r.rating);
  const avg = Number((ratings.reduce((a, b) => a + b, 0) / total).toFixed(2));

  const posCount = responses.filter((r) => r.rating >= 4).length;
  const neuCount = responses.filter((r) => r.rating === 3).length;
  const negCount = responses.filter((r) => r.rating <= 2).length;

  const areaCounts: Record<string, number> = {};
  responses.forEach((r) => {
    (r.answers?.areasToImprove || []).forEach((a) => {
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    });
  });

  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);

  const recurringIssues = sortedAreas.slice(0, 4).map(([category, freq]) => ({
    category: category.toUpperCase(),
    frequency: freq,
    summary: `Sebanyak ${freq} responden merekodkan ${category.toLowerCase()} sebagai sektor kritikal yang memerlukan penyelarasan segera.`,
    sampleQuotes: responses
      .filter((r) => r.answers?.areasToImprove?.includes(category) && (r.answers.weaknesses || r.answers.blockingIssues))
      .slice(0, 2)
      .map((r) => r.answers.weaknesses || r.answers.blockingIssues)
  }));

  return {
    programId: program.id,
    analyzedAt: new Date().toISOString(),
    totalResponsesAnalyzed: total,
    overallSummary: `Program "${program.name}" mencatatkan ${total} maklum balas urusetia dengan purata skor kepuasan ${avg}/5.0. Penilaian menunjukkan tahap dedikasi urusetia yang cemerlang namun memerlukan penambahbaikan ketara dalam aspek ${sortedAreas[0]?.[0] || 'komunikasi'} dan ${sortedAreas[1]?.[0] || 'pengurusan masa'}.`,
    strengths: responses.map((r) => r.answers.strengths).filter(Boolean).slice(0, 5),
    mainWeaknesses: responses.map((r) => r.answers.weaknesses).filter(Boolean).slice(0, 5),
    recurringIssues,
    criticalIssues: responses.map((r) => r.answers.blockingIssues).filter(Boolean).slice(0, 3),
    recommendations: responses.map((r) => r.answers.doDifferently).filter(Boolean).slice(0, 5),
    actionPlan: sortedAreas.slice(0, 4).map(([area], idx) => ({
      issue: area,
      causeOrObservation: `Dikenalpasti melalui maklum balas berulang urusetia di bahagian ${area.toLowerCase()}.`,
      proposedAction: `Lantik penyelaras khas dan wujudkan standard operating procedure (SOP) semakan awal untuk ${area.toLowerCase()}.`,
      priority: idx < 2 ? 'Tinggi' : 'Sederhana',
    })),
    sentiment: {
      positive: Math.round((posCount / total) * 100),
      neutral: Math.round((neuCount / total) * 100),
      negative: Math.round((negCount / total) * 100),
    },
    anonymousQuotes: responses.map((r) => r.answers.weaknesses || r.answers.strengths).filter(Boolean).slice(0, 4)
  };
}

// ----------------------------------------------------
// VITE INTEGRATION / STATIC SERVE
// ----------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware attached in development mode.');
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, falling back to static files:', viteErr);
      serveStaticFiles();
    }
  } else {
    serveStaticFiles();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SUARA URUSETIA server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

function serveStaticFiles() {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send('<!DOCTYPE html><html><head><title>SUARA URUSETIA</title></head><body><div id="root">Memuatkan sistem Suara Urusetia...</div></body></html>');
    }
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
