import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Send,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Table,
  Key
} from 'lucide-react';
import { Program, FeedbackResponse, GoogleSheetsSettings } from '../../types';

interface GoogleSheetsViewProps {
  programs: Program[];
  selectedProgramId: string;
  responses: FeedbackResponse[];
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  programs,
  selectedProgramId,
  responses,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [settings, setSettings] = useState<GoogleSheetsSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Actions state
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPrograms, setSyncingPrograms] = useState(false);
  
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncProgramsResult, setSyncProgramsResult] = useState<{ success: boolean; message: string } | null>(null);
  const [creatingAdminTab, setCreatingAdminTab] = useState(false);
  const [adminTabResult, setAdminTabResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [showFullScript, setShowFullScript] = useState(false);

  const activeProgram = programs.find((p) => p.id === selectedProgramId) || programs[0];

  // Fetch current settings on load
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/google-sheets');
      const data = await res.json().catch(() => ({}));
      if (data?.settings) {
        setSettings(data.settings);
        const activeWebhook = data.settings.webhookUrl || localStorage.getItem('gs_webhook_url') || '';
        const activeSheet = data.settings.sheetUrl || localStorage.getItem('gs_sheet_url') || '';
        setWebhookUrl(activeWebhook);
        setSheetUrl(activeSheet);
        setAutoSync(data.settings.autoSync !== undefined ? data.settings.autoSync : true);
      }
    } catch (err) {
      console.warn('Ralat memuatkan tetapan dari pelayan, memuatkan dari storan tempatan:', err);
      const cachedWebhook = localStorage.getItem('gs_webhook_url') || '';
      const cachedSheet = localStorage.getItem('gs_sheet_url') || '';
      if (cachedWebhook) setWebhookUrl(cachedWebhook);
      if (cachedSheet) setSheetUrl(cachedSheet);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccessMsg(null);
    setTestResult(null);

    const cleanWebhook = webhookUrl.trim();
    const cleanSheet = sheetUrl.trim();

    // Simpan serta-merta ke LocalStorage supaya tidak hilang sama sekali
    try {
      if (cleanWebhook) localStorage.setItem('gs_webhook_url', cleanWebhook);
      if (cleanSheet) localStorage.setItem('gs_sheet_url', cleanSheet);
    } catch {}

    try {
      const res = await fetch('/api/admin/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: cleanWebhook,
          sheetUrl: cleanSheet,
          autoSync,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSaveSuccessMsg('✅ Tetapan Google Sheets berjaya disimpan.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        // Jika pelayan memulangkan ralat tetapi kita sudah simpan ke LocalStorage
        setSettings((prev) => ({
          webhookUrl: cleanWebhook,
          sheetUrl: cleanSheet,
          autoSync,
          lastSyncStatus: prev?.lastSyncStatus || 'idle',
        }));
        setSaveSuccessMsg('✅ Tetapan disimpan secara tempatan (Local Storage).');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch {
      // Jika pelayan offline atau ralat sambungan
      setSettings((prev) => ({
        webhookUrl: cleanWebhook,
        sheetUrl: cleanSheet,
        autoSync,
        lastSyncStatus: prev?.lastSyncStatus || 'idle',
      }));
      setSaveSuccessMsg('✅ Tetapan disimpan secara selamat di pelayar anda.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    const cleanWebhook = webhookUrl.trim();
    if (!cleanWebhook) {
      setTestResult({
        success: false,
        message: 'Sila masukkan URL Webhook Google Apps Script terlebih dahulu.',
      });
      return;
    }

    if (cleanWebhook.includes('docs.google.com/spreadsheets')) {
      setTestResult({
        success: false,
        message: 'URL yang dimasukkan di ruangan Webhook ialah pautan Google Sheet (docs.google.com). Sila masukkan URL Webhook yang bermula dengan https://script.google.com/macros/s/.../exec.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/google-sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cleanWebhook }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message });
        fetchSettings();
        return;
      }

      if (data.error) {
        setTestResult({ success: false, message: data.error });
        return;
      }

      throw new Error('Pelayan mengembalikan ralat.');
    } catch (err: any) {
      // FALLBACK: Uji terus dari pelayar ke Google Apps Script jika pelayan backend gagal
      try {
        const directRes = await fetch(cleanWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            timestamp: new Date().toLocaleString('ms-MY'),
            responseId: 'TEST-BROWSER',
            programName: 'UJIAN SAMBUNGAN (DIRECT BROWSER)',
            rating: 5,
            areasToImprove: ['Sistem'],
            strengths: 'Sambungan terus berjaya dari pelayar ke Google Sheet!',
            weaknesses: '-',
            unresolvedIssues: '-',
            blockingIssues: '-',
            doDifferently: '-',
            additionalComments: 'Ujian dihantar terus dari pelayar web.',
          }),
          redirect: 'follow',
        });

        if (directRes.ok) {
          setTestResult({
            success: true,
            message: '✅ Sambungan Berjaya! Data ujian telah dihantar terus ke Google Sheet anda.',
          });
          return;
        }
      } catch (directErr) {
        console.warn('Direct test error:', directErr);
      }

      setTestResult({
        success: false,
        message: 'Ralat sambungan: ' + (err?.message || 'Tidak dapat menghubungi webhook. Pastikan skrip telah di-Deploy sebagai Web app dengan akses "Anyone".'),
      });
    } finally {
      setTesting(false);
    }
  };

  // Sync All Existing Responses
  const handleSyncAll = async (allPrograms: boolean = false) => {
    const cleanWebhook = webhookUrl.trim();
    if (!cleanWebhook) {
      alert('Sila konfigurasikan URL Webhook terlebih dahulu.');
      return;
    }

    setSyncingAll(true);
    setSyncResult(null);

    // 1. Cuba melalui pelayan backend dahulu
    try {
      const res = await fetch('/api/admin/google-sheets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: cleanWebhook,
          programId: allPrograms ? undefined : activeProgram?.id,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (res.ok && data?.success) {
        setSyncResult({ success: true, message: data.message });
        fetchSettings();
        setSyncingAll(false);
        return;
      }
    } catch (serverErr) {
      console.warn('Pelayan backend gagal, mencuba penghantaran terus dari pelayar:', serverErr);
    }

    // 2. Sandaran terus dari pelayar (Direct Browser Sync)
    const targetResponses = allPrograms
      ? responses
      : responses.filter((r) => r.programId === activeProgram?.id);

    if (targetResponses.length === 0) {
      setSyncResult({
        success: true,
        message: 'Tiada maklum balas untuk disegerakkan.',
      });
      setSyncingAll(false);
      return;
    }

    const items = targetResponses.map((r) => {
      const prog = programs.find((p) => p.id === r.programId);
      return {
        timestamp: new Date(r.createdAt).toLocaleString('ms-MY'),
        responseId: r.id,
        programName: prog ? prog.name : 'Program',
        rating: r.rating,
        areasToImprove: r.answers.areasToImprove || [],
        strengths: r.answers.strengths || '',
        weaknesses: r.answers.weaknesses || '',
        unresolvedIssues: r.answers.unresolvedIssues || '',
        blockingIssues: r.answers.blockingIssues || '',
        doDifferently: r.answers.doDifferently || '',
        additionalComments: r.answers.additionalComments || '',
      };
    });

    try {
      const directRes = await fetch(cleanWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ batch: true, items }),
        redirect: 'follow',
      });

      if (directRes.ok) {
        setSyncResult({
          success: true,
          message: `✅ Berjaya menyegerakkan ${items.length} maklum balas terus ke Google Sheet anda!`,
        });
        setSyncingAll(false);
        return;
      }
    } catch (directErr) {
      console.warn('Direct sync responses error:', directErr);
    }

    setSyncResult({
      success: false,
      message: 'Gagal menyegerakkan maklum balas. Pastikan URL Webhook tepat dan skrip Apps Script telah di-Deploy.',
    });
    setSyncingAll(false);
  };

  // Sync Senarai Program ke Google Sheets (Tab "Senarai Program")
  const handleSyncPrograms = async () => {
    const cleanWebhook = webhookUrl.trim();
    if (!cleanWebhook) {
      alert('Sila konfigurasikan URL Webhook terlebih dahulu.');
      return;
    }
    setSyncingPrograms(true);
    setSyncProgramsResult(null);

    // Siapkan senarai program daripada props/state
    const programList = (programs.length > 0 ? programs : [activeProgram]).filter(Boolean).map((p) => ({
      id: p.id,
      name: p.name,
      date: p.date,
      location: p.location || '-',
      description: p.description || '-',
      status: p.status,
      tokenCount: 0,
      createdAt: new Date(p.createdAt).toLocaleString('ms-MY'),
    }));

    // 1. Cuba melalui pelayan backend dahulu
    try {
      const res = await fetch('/api/admin/google-sheets/sync-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cleanWebhook }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (res.ok && data?.success) {
        setSyncProgramsResult({ success: true, message: data.message });
        fetchSettings();
        setSyncingPrograms(false);
        return;
      }
    } catch (serverErr) {
      console.warn('Pelayan backend gagal, mencuba penghantaran terus dari pelayar:', serverErr);
    }

    // 2. Sandaran terus dari pelayar (Direct Browser Sync)
    try {
      const directRes = await fetch(cleanWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'SYNC_PROGRAMS',
          programs: programList,
          isFirstChunk: true,
        }),
        redirect: 'follow',
      });

      if (directRes.ok) {
        setSyncProgramsResult({
          success: true,
          message: `✅ Berjaya menyegerakkan ${programList.length} program terus ke tab "Senarai Program" di Google Sheet anda!`,
        });
        setSyncingPrograms(false);
        return;
      }
    } catch (directErr) {
      console.warn('Direct sync programs error:', directErr);
    }

    setSyncProgramsResult({
      success: false,
      message: 'Gagal menyegerakkan program. Sila pastikan Webhook URL betul dan skrip telah di-Deploy dengan akses "Anyone".',
    });
    setSyncingPrograms(false);
  };

  // Cipta atau semak tab Akaun Pentadbir
  const handleCreateAdminTab = async () => {
    const cleanWebhook = webhookUrl.trim();
    if (!cleanWebhook || creatingAdminTab) return;
    setCreatingAdminTab(true);
    setAdminTabResult(null);

    // 1. Cuba backend dahulu
    try {
      const res = await fetch('/api/admin/google-sheets/init-admin-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cleanWebhook }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (res.ok && data?.success) {
        setAdminTabResult({
          success: true,
          message: data.message || 'Tab "Akaun Pentadbir" telah sedia ada / berjaya diwujudkan di Google Sheet anda!',
        });
        setCreatingAdminTab(false);
        return;
      }
    } catch (serverErr) {
      console.warn('Pelayan backend gagal, memanggil webhook terus dari pelayar:', serverErr);
    }

    // 2. Sandaran terus dari pelayar (Direct Browser Call)
    try {
      const directRes = await fetch(cleanWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'INIT_ADMIN_TAB' }),
        redirect: 'follow',
      });

      if (directRes.ok) {
        setAdminTabResult({
          success: true,
          message: '✅ Tab "Akaun Pentadbir" berjaya disahkan/dicipta di Google Sheet anda!',
        });
        setCreatingAdminTab(false);
        return;
      }
    } catch (directErr) {
      console.warn('Direct init admin tab error:', directErr);
    }

    setAdminTabResult({
      success: false,
      message: 'Gagal mewujudkan tab. Sila pastikan Webhook URL betul dan skrip terkini telah di-Deploy dengan akses "Anyone".',
    });
    setCreatingAdminTab(false);
  };

  // Google Apps Script code to copy
  const appsScriptCode = `/**
 * =========================================================================
 * SUARA URUSETIA - GOOGLE SHEETS WEBHOOK (PILIHAN A)
 * =========================================================================
 * Skrip ini menyegerakkan 3 perkara secara automatik ke dalam Google Sheets:
 * 1. Tab "Akaun Pentadbir" : Urus username & kata laluan admin terus dari Sheet!
 * 2. Tab "Senarai Program" : Rekod program baru dicipta & bilangan token
 * 3. Tab "Maklum Balas Post-Mortem" : Maklum balas urusetia secara telus/anonymous
 */

/**
 * =========================================================================
 * CARA CEPAT: JALANKAN UNTUK CIPTA SEMUA TAB SERTA-MERTA!
 * =========================================================================
 * Di toolbar bahagian atas editor Apps Script, pilih fungsi 'setupSemuaTab'
 * kemudian klik butang Run (▷).
 * Semua 3 tab ("Akaun Pentadbir", "Senarai Program", "Maklum Balas Post-Mortem")
 * akan terus muncul di Google Sheet anda!
 */
function setupSemuaTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateAdminSheet(ss);
  getOrCreateProgramsSheet(ss);
  getOrCreateFeedbackSheet(ss);
  Logger.log("✅ Berjaya! Tab 'Akaun Pentadbir', 'Senarai Program' & 'Maklum Balas Post-Mortem' telah sedia ada di Google Sheet.");
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      // Pastikan tab pentadbir tetap ada jika dipanggil kosong
      getOrCreateAdminSheet(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Tiada data diterima" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(contents);

    // KES 0: CIPTA / INISIALISASI TAB AKAUN PENTADBIR
    if (data.type === "INIT_ADMIN_TAB") {
      var adminSheet = getOrCreateAdminSheet(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Tab 'Akaun Pentadbir' telah berjaya dicipta/disahkan di Google Sheet anda!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // KES 1: REKOD PROGRAM TUNGGAL (Setiap kali program baru dicipta / dikemas kini)
    if (data.type === "PROGRAM") {
      getOrCreateAdminSheet(ss); // pastikan tab admin ada
      var progSheet = getOrCreateProgramsSheet(ss);
      upsertProgramRow(progSheet, data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Program berjaya disimpan ke tab Senarai Program" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // KES 2: PENYEGERAKAN SEMUA PROGRAM (Update/Overwrite - bukan duplicate/append)
    if (data.type === "SYNC_PROGRAMS" && Array.isArray(data.programs)) {
      getOrCreateAdminSheet(ss); // pastikan tab admin ada
      var progSheet = getOrCreateProgramsSheet(ss);
      if (data.isFirstChunk) {
        // Kosongkan baris data lama (kekalkan baris 1 header)
        var lastRow = progSheet.getLastRow();
        if (lastRow > 1) {
          progSheet.deleteRows(2, lastRow - 1);
        }
      }
      appendMultiplePrograms(progSheet, data.programs);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.programs.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // KES 3: PENGESAHAN AKAUN PENTADBIR (AUTH_ADMIN - Semak password dari Google Sheet)
    if (data.type === "AUTH_ADMIN") {
      var adminSheet = getOrCreateAdminSheet(ss);
      var authResult = checkAdminLogin(adminSheet, data.username, data.password);
      return ContentService.createTextOutput(JSON.stringify(authResult))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // KES 4: MAKLUM BALAS URUSETIA (FEEDBACK)
    getOrCreateAdminSheet(ss); // pastikan tab admin ada
    var feedbackSheet = getOrCreateFeedbackSheet(ss);

    // Sekiranya penghantaran maklum balas berkelompok (batch sync pantas)
    if (data.batch && Array.isArray(data.items)) {
      appendMultipleFeedback(feedbackSheet, data.items);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.items.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Penghantaran respon maklum balas tunggal
    appendFeedbackRow(feedbackSheet, data);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Maklum balas berjaya direkodkan" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Dapatkan atau cipta Tab "Senarai Program"
function getOrCreateProgramsSheet(ss) {
  var sheet = ss.getSheetByName("Senarai Program");
  if (!sheet) {
    sheet = ss.insertSheet("Senarai Program");
    var headers = [
      "Tarikh Cipta",
      "ID Program",
      "Nama Program",
      "Tarikh Acara",
      "Lokasi",
      "Penerangan",
      "Jumlah Token",
      "Status"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0f766e"); // Teal 700
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Dapatkan atau cipta Tab "Maklum Balas Post-Mortem"
function getOrCreateFeedbackSheet(ss) {
  var sheet = ss.getSheetByName("Maklum Balas Post-Mortem");
  if (!sheet) {
    sheet = ss.getActiveSheet();
    if (sheet.getName() === "Sheet1" || sheet.getName() === "Helaian1") {
      sheet.setName("Maklum Balas Post-Mortem");
    }
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Tarikh & Masa",
      "ID Respon",
      "Nama Program",
      "Penarafan (1-5)",
      "Bahagian Ditambahbaik",
      "Perkara Berjalan Baik (Kelebihan)",
      "Kelemahan Utama",
      "Isu Belum Selesai",
      "Gangguan Tugas / Halangan",
      "Cadangan Tindakan / Cara Berbeza",
      "Komen Tambahan"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0d9488"); // Teal 600
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Dapatkan atau cipta Tab "Akaun Pentadbir" (Untuk kawal kata laluan di Sheet)
function getOrCreateAdminSheet(ss) {
  var sheet = ss.getSheetByName("Akaun Pentadbir");
  if (!sheet) {
    sheet = ss.insertSheet("Akaun Pentadbir");
    var headers = [
      "Username",
      "Kata Laluan (Password)",
      "Nama Pegawai / Urusetia",
      "Peranan (Role)",
      "Status"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4338ca"); // Indigo 700
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    // Tetapkan akaun lalai permulaan (Boleh ubah terus dalam Google Sheet)
    sheet.appendRow(["admin", "suara2026", "Pentadbir Utama", "Super Admin", "Aktif"]);
    sheet.appendRow(["urusetia", "suara2026", "Urusetia Program", "Admin", "Aktif"]);
  }
  return sheet;
}

// Semak log masuk pentadbir dari tab "Akaun Pentadbir"
function checkAdminLogin(sheet, username, password) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { status: "error", authenticated: false, message: "Tiada rekod pentadbir dalam Google Sheet." };
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var cleanUser = String(username || "").trim().toLowerCase();
  var cleanPass = String(password || "").trim();

  for (var i = 0; i < data.length; i++) {
    var rowUser = String(data[i][0] || "").trim().toLowerCase();
    var rowPass = String(data[i][1] || "").trim();
    var rowName = String(data[i][2] || "Pentadbir").trim();
    var rowRole = String(data[i][3] || "Admin").trim();
    var rowStatus = String(data[i][4] || "Aktif").trim().toLowerCase();

    if (rowUser === cleanUser && rowPass === cleanPass) {
      if (rowStatus === "tidak aktif" || rowStatus === "inactive" || rowStatus === "digantung") {
        return { status: "error", authenticated: false, message: "Akaun ini berstatus Tidak Aktif dalam Google Sheet." };
      }
      return {
        status: "success",
        authenticated: true,
        user: { name: rowName, role: rowRole, username: rowUser }
      };
    }
  }

  return { status: "error", authenticated: false, message: "Nama pengguna atau kata laluan tidak sepadan di Google Sheet." };
}

// Rekod atau kemas kini baris program ke tab "Senarai Program"
function upsertProgramRow(sheet, item) {
  var row = [
    item.createdAt || new Date().toLocaleString("ms-MY"),
    item.id || "-",
    item.name || "-",
    item.date || "-",
    item.location || "-",
    item.description || "-",
    item.tokenCount !== undefined ? item.tokenCount : 0,
    item.status || "Active"
  ];

  var lastRow = sheet.getLastRow();
  if (lastRow > 1 && item.id) {
    var idValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      if (String(idValues[i][0]) === String(item.id)) {
        sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return;
      }
    }
  }

  sheet.appendRow(row);
}

// Rekod satu baris ke tab "Senarai Program" (Legacy fallback)
function appendProgramRow(sheet, item) {
  upsertProgramRow(sheet, item);
}

// Rekod banyak program sekaligus dengan pantas (Batch Write)
function appendMultiplePrograms(sheet, programs) {
  if (!programs || programs.length === 0) return;
  var rows = [];
  for (var p = 0; p < programs.length; p++) {
    var item = programs[p];
    rows.push([
      item.createdAt || new Date().toLocaleString("ms-MY"),
      item.id || "-",
      item.name || "-",
      item.date || "-",
      item.location || "-",
      item.description || "-",
      item.tokenCount !== undefined ? item.tokenCount : 0,
      item.status || "Active"
    ]);
  }
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

// Rekod satu baris ke tab "Maklum Balas Post-Mortem"
function appendFeedbackRow(sheet, item) {
  var areas = "";
  if (Array.isArray(item.areasToImprove)) {
    areas = item.areasToImprove.join(", ");
  } else if (item.areasToImprove) {
    areas = item.areasToImprove;
  }

  var row = [
    item.timestamp || new Date().toLocaleString("ms-MY"),
    item.responseId || item.id || "-",
    item.programName || "-",
    item.rating || "-",
    areas || "-",
    item.strengths || "-",
    item.weaknesses || "-",
    item.unresolvedIssues || "-",
    item.blockingIssues || "-",
    item.doDifferently || "-",
    item.additionalComments || "-"
  ];
  sheet.appendRow(row);
}

// Rekod banyak maklum balas sekaligus dengan pantas (Batch Write)
function appendMultipleFeedback(sheet, items) {
  if (!items || items.length === 0) return;
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var areas = "";
    if (Array.isArray(item.areasToImprove)) {
      areas = item.areasToImprove.join(", ");
    } else if (item.areasToImprove) {
      areas = item.areasToImprove;
    }
    rows.push([
      item.timestamp || new Date().toLocaleString("ms-MY"),
      item.responseId || item.id || "-",
      item.programName || "-",
      item.rating !== undefined ? item.rating : "-",
      areas || "-",
      item.strengths || "-",
      item.weaknesses || "-",
      item.unresolvedIssues || "-",
      item.blockingIssues || "-",
      item.doDifferently || "-",
      item.additionalComments || "-"
    ]);
  }
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const isConfigured = Boolean(webhookUrl.trim());

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Integrasi Google Sheets</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Pilihan 1 (Apps Script Webhook)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sambungkan borang maklum balas terus ke Google Sheets anda secara masa nyata tanpa perlu akaun Cloud yang rumit.
            </p>
          </div>
        </div>

        {/* Status Badge & Open Sheet Link */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(sheetUrl.trim() || settings?.sheetUrl) && (
            <a
              href={sheetUrl.trim() || settings?.sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold hover:bg-teal-100 transition shadow-2xs"
            >
              <span>Buka Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {isConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Webhook Dikonfigurasi</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Belum Dikonfigurasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col (7 cols): Configuration & Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Webhook URL Setup Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-900">
                  URL Webhook Google Apps Script <span className="text-rose-500">*</span>
                </label>
                {webhookUrl.includes('script.google.com') && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Format Sah (script.google.com)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Dapatkan URL ini selepas <em>Deploy &gt; New deployment &gt; Web app (Anyone)</em> di Google Sheet anda.
              </p>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs sm:text-sm font-mono px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none bg-slate-50/50"
              />

              {/* Smart Validation Warning if user enters docs.google.com */}
              {webhookUrl.includes('docs.google.com/spreadsheets') && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Pautan Google Sheet dikesan dalam ruangan Webhook:</strong>
                      <span>
                        Pautan ini ialah pautan fail Google Sheet anda (<code>docs.google.com</code>). Untuk membolehkan data masuk secara automatik, sistem memerlukan <strong>URL Webhook Web app</strong> yang dijana melalui <em>Apps Script</em> (bermula dengan <code>https://script.google.com/macros/s/.../exec</code>).
                      </span>
                    </div>
                  </div>
                  <div className="pl-6 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSheetUrl(webhookUrl);
                        setWebhookUrl('');
                      }}
                      className="text-[11px] font-bold bg-amber-200/70 hover:bg-amber-300 text-amber-950 px-2.5 py-1 rounded-lg transition"
                    >
                      ➔ Alihkan pautan ini ke ruangan "Pautan Fail Google Sheet" di bawah
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google Sheet File URL (Direct Shortcut) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900">
                  Pautan Fail Google Sheet Anda (POSTMORTEM PROGRAM)
                </label>
                {sheetUrl.trim() && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Buka Sheet Sekarang</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Simpan pautan fail Google Sheet anda di sini untuk akses pantas urusetia.
              </p>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1A2b3C.../edit"
                className="w-full text-xs sm:text-sm font-mono px-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none bg-slate-50/50"
              />
            </div>

            {/* Auto-sync Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Segerakkan Automatik (Live Auto-Sync)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Hantar baris baharu ke Google Sheet serta-merta setiap kali responden selesai mengisi borang.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Last sync info if available */}
            {settings?.lastSyncTime && (
              <div className="text-[11px] text-slate-500 flex items-center gap-2 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Sync Terakhir: <strong>{new Date(settings.lastSyncTime).toLocaleString('ms-MY')}</strong> ({settings.lastSyncMessage || 'Berjaya'})
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Tetapan</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTestConnection}
                disabled={testing || !webhookUrl.trim()}
                className="text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Menguji Webhook...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    <span>Uji Sambungan (1 Baris Ujian)</span>
                  </>
                )}
              </button>
            </div>

            {/* Feedback Notifications */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3.5 border rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="w-full">
                  <p className="font-bold">{testResult.success ? 'Ujian Berjaya!' : 'Ujian Sambungan Gagal'}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{testResult.message}</p>
                  {!testResult.success && testResult.message.includes('404') && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-[11px] text-rose-950 space-y-1 bg-white/50 p-2.5 rounded-lg">
                      <p className="font-bold text-rose-950">Langkah Memperbaharui URL Webhook (404 Not Found):</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-rose-900">
                        <li>Buka Google Sheet &gt; <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                        <li>Klik butang biru <strong>Deploy</strong> (atas kanan) &gt; <strong>Manage deployments</strong>.</li>
                        <li>Salin URL di bawah <strong>Web app &gt; URL</strong> (yang berakhir dengan <code>/exec</code>).</li>
                        <li>Tampalkan di kotak <strong>URL Webhook Google Apps Script</strong> di atas, dan klik <strong>Simpan Tetapan</strong>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Admin Accounts Tab Card (Pilihan A: Tab Akaun Pentadbir) */}
          <div className="bg-white border border-indigo-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Tab &ldquo;Akaun Pentadbir&rdquo; (Kata Laluan &amp; Username)</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    Tab 3 di Sheet
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kawal kata laluan dan senarai pegawai urusetia terus daripada Google Sheet anda tanpa perlu ubah kod.
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                  <span>Tab belum muncul dalam Google Sheet anda?</span>
                </p>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed max-w-xl">
                  Tekan butang di sebelah untuk mewujudkan tab ini secara automatik dengan akaun lalai (<code>admin</code> / <code>suara2026</code>). Anda kemudian boleh menukar password atau menambah akaun baharu di baris seterusnya!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCreateAdminTab}
                  disabled={creatingAdminTab || !webhookUrl.trim()}
                  className="text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {creatingAdminTab ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Sedang Mewujudkan...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Cipta / Semak Tab Akaun Pentadbir</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {adminTabResult && (
              <div
                className={`p-3.5 border rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                  adminTabResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {adminTabResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="w-full">
                  <p className="font-bold">{adminTabResult.success ? 'Berjaya!' : 'Gagal Menyemak/Cipta Tab'}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{adminTabResult.message}</p>
                  {!adminTabResult.success && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-[11px] text-rose-950 space-y-1 bg-white/50 p-2.5 rounded-lg">
                      <p className="font-bold text-rose-950">Tip Sekiranya Belum Mengemaskini Skrip:</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-rose-900">
                        <li>Klik butang <strong>&ldquo;Salin Kod Skrip&rdquo;</strong> di bawah dan tampal ke Apps Script.</li>
                        <li>Di Apps Script, anda juga boleh pilih fungsi <code>setupSemuaTab</code> di toolbar atas dan tekan butang <strong>▷ Run</strong> untuk terus memunculkannya!</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Program Sync Card (Pilihan A: Tab Senarai Program) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    <span>Segerakkan Senarai Program</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    Tab &ldquo;Senarai Program&rdquo;
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap kali anda cipta atau ubah program, ia akan disegerakkan ke Google Sheets. Menekan butang ini akan <strong>mengemas kini (update/overwrite)</strong> semua {programs.length} program sedia ada ke dalam sheet tanpa menggandakan atau mengotorkan senarai.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg shrink-0">
                {programs.length} Program
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Penyegerakan Automatik Aktif: <span className="text-emerald-700 font-bold">Auto-Sync Hidup</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Data program merangkumi ID, Nama, Tarikh, Lokasi, Penerangan &amp; Bilangan Kod Akses.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSyncPrograms}
                  disabled={syncingPrograms || !webhookUrl.trim() || programs.length === 0}
                  className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {syncingPrograms ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      <span>Menyegerak Program...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-teal-400" />
                      <span>Segerak Semua Program ({programs.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {syncProgramsResult && (
              <div
                className={`p-3.5 border rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                  syncProgramsResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {syncProgramsResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="w-full">
                  <p className="font-bold">{syncProgramsResult.success ? 'Penyegerakan Program Berjaya!' : 'Penyegerakan Program Gagal'}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{syncProgramsResult.message}</p>
                  {!syncProgramsResult.success && syncProgramsResult.message.includes('404') && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-[11px] text-rose-950 space-y-1 bg-white/50 p-2.5 rounded-lg">
                      <p className="font-bold text-rose-950">Langkah Memperbaharui URL Webhook (404 Not Found):</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-rose-900">
                        <li>Buka Google Sheet &gt; <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                        <li>Klik butang biru <strong>Deploy</strong> (atas kanan) &gt; <strong>Manage deployments</strong>.</li>
                        <li>Salin URL di bawah <strong>Web app &gt; URL</strong> (yang berakhir dengan <code>/exec</code>).</li>
                        <li>Tampalkan di kotak <strong>URL Webhook Google Apps Script</strong> di atas, dan klik <strong>Simpan Tetapan</strong>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Batch Sync Card (Sync Existing Responses) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>Segerakkan Maklum Balas Sedia Ada</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    Tab &ldquo;Maklum Balas Post-Mortem&rdquo;
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hantar semua data maklum balas yang telah dikumpulkan ke Google Sheet dalam satu klik.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg shrink-0">
                {responses.length} Respon
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Program Terpilih: <span className="text-teal-700 font-bold">{activeProgram?.name}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Terdapat {responses.length} maklum balas sedia ada untuk program ini.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSyncAll(false)}
                  disabled={syncingAll || !webhookUrl.trim() || responses.length === 0}
                  className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {syncingAll ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyegerak...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Segerak Program Ini</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {syncResult && (
              <div
                className={`p-3.5 border rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                  syncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="w-full">
                  <p className="font-bold">{syncResult.success ? 'Penyegerakan Berjaya!' : 'Penyegerakan Gagal'}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{syncResult.message}</p>
                  {!syncResult.success && syncResult.message.includes('404') && (
                    <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-[11px] text-rose-950 space-y-1 bg-white/50 p-2.5 rounded-lg">
                      <p className="font-bold text-rose-950">Langkah Memperbaharui URL Webhook (404 Not Found):</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-rose-900">
                        <li>Buka Google Sheet &gt; <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                        <li>Klik butang biru <strong>Deploy</strong> (atas kanan) &gt; <strong>Manage deployments</strong>.</li>
                        <li>Salin URL di bawah <strong>Web app &gt; URL</strong> (yang berakhir dengan <code>/exec</code>).</li>
                        <li>Tampalkan di kotak <strong>URL Webhook Google Apps Script</strong> di atas, dan klik <strong>Simpan Tetapan</strong>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Data Columns Structure Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Table className="w-4 h-4 text-teal-600" />
              <span>Struktur 3 Tab Google Sheet yang Dihasilkan</span>
            </h4>

            {/* Tab 1 Structure */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Tab 1: &ldquo;Senarai Program&rdquo;</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">8 Lajur</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                {[
                  '1. Tarikh Cipta',
                  '2. ID Program',
                  '3. Nama Program',
                  '4. Tarikh Acara',
                  '5. Lokasi',
                  '6. Penerangan',
                  '7. Jumlah Token',
                  '8. Status',
                ].map((col, idx) => (
                  <div key={idx} className="bg-teal-50/60 border border-teal-100 px-2 py-1.5 rounded-lg text-teal-900 font-medium">
                    {col}
                  </div>
                ))}
              </div>
            </div>

            {/* Tab 2 Structure */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Tab 2: &ldquo;Maklum Balas Post-Mortem&rdquo;</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">11 Lajur</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                {[
                  '1. Tarikh & Masa',
                  '2. ID Respon',
                  '3. Nama Program',
                  '4. Penarafan (1-5)',
                  '5. Bahagian Ditambahbaik',
                  '6. Kelebihan / Berjalan Baik',
                  '7. Kelemahan Utama',
                  '8. Isu Belum Selesai',
                  '9. Gangguan / Halangan',
                  '10. Cadangan Tindakan',
                  '11. Komen Tambahan',
                ].map((col, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg text-slate-700 font-medium">
                    {col}
                  </div>
                ))}
              </div>
            </div>

            {/* Tab 3 Structure: Akaun Pentadbir */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Tab 3: &ldquo;Akaun Pentadbir&rdquo;</span>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-semibold">5 Lajur (Urus Kata Laluan di Sheet)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Anda boleh tukar password atau tambah akaun urusetia baharu secara terus dalam tab ini di Google Sheet!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px]">
                {[
                  '1. Username',
                  '2. Kata Laluan',
                  '3. Nama Urusetia',
                  '4. Peranan (Role)',
                  '5. Status (Aktif)',
                ].map((col, idx) => (
                  <div key={idx} className="bg-indigo-50/70 border border-indigo-100 px-2 py-1.5 rounded-lg text-indigo-900 font-medium">
                    {col}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Col (5 cols): Step-by-Step Guide & Apps Script Code */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>Panduan 5 Langkah Persediaan</span>
              </h3>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Steps */}
            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block">Buka Google Sheets Baharu</strong>
                  <span>Buka Google Sheets di akaun Google anda (boleh namakan cth: <em>Maklum Balas Suara Urusetia</em>).</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block">Buka Apps Script</strong>
                  <span>Di bar menu Google Sheets, klik <strong>Extensions</strong> (atau <strong>Pelanjutan</strong>) &gt; <strong>Apps Script</strong>.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block">Tampal Kod Skrip</strong>
                  <span>Padam semua kod sedia ada di editor Apps Script, dan salin kod lengkap di bawah.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 block">Deploy sebagai Web App</strong>
                  <p className="mt-0.5 leading-relaxed text-[11px]">
                    Klik butang biru <strong>Deploy</strong> &gt; <strong>New deployment</strong>.<br />
                    - Gear type: <strong>Web app</strong><br />
                    - Execute as: <strong>Me (Akaun anda)</strong><br />
                    - Who has access: <strong className="text-rose-600">Anyone</strong> (Penting!)
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  5
                </span>
                <div>
                  <strong className="text-slate-900 block">Salin URL & Simpan</strong>
                  <span>Salin <strong>Web app URL</strong> yang diberikan oleh Google, kemudian tampal di kotak input di sebelah kiri dan klik <strong>Simpan Tetapan</strong>.</span>
                </div>
              </li>
            </ol>

            {/* Code Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Kod Google Apps Script</span>
                <button
                  onClick={handleCopyCode}
                  className="text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Kod Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kod Skrip</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                  {appsScriptCode}
                </pre>
              </div>
            </div>

            {/* Security note */}
            <div className="text-[11px] text-slate-500 flex items-start gap-2 pt-1 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Data diproses secara terlindung. Nama atau butiran peribadi responden tidak pernah dihantar ke Google Sheets.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
