import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { ChevronLeft, Search, UserPlus, Trash2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// RUN THESE IN SUPABASE SQL EDITOR BEFORE USING THIS PAGE:
//
// -- 1. Doctors table
// create table public.doctors (
//   id uuid default gen_random_uuid() primary key,
//   username text unique not null,
//   password text not null,
//   created_at timestamptz default now()
// );
// alter table public.doctors enable row level security;
// create policy "allow all" on public.doctors for all using (true) with check (true);
//
// -- 2. Doctor-Patient relationship
// create table public.doctor_patients (
//   id uuid default gen_random_uuid() primary key,
//   doctor_id uuid references public.doctors(id) on delete cascade,
//   patient_id uuid not null,
//   added_at timestamptz default now(),
//   unique(doctor_id, patient_id)
// );
// alter table public.doctor_patients enable row level security;
// create policy "allow all" on public.doctor_patients for all using (true) with check (true);
//
// -- 3. Game sessions (for doctor to view patient history)
// create table public.game_sessions (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid not null,
//   game_id text,
//   game_type text,
//   game_name text,
//   win boolean,
//   stars integer,
//   coins_earned integer,
//   metrics jsonb,
//   created_at timestamptz default now()
// );
// alter table public.game_sessions enable row level security;
// create policy "allow all" on public.game_sessions for all using (true) with check (true);
//
// -- ถ้า table มีอยู่แล้ว เพิ่ม column metrics ด้วย:
// alter table public.game_sessions add column if not exists metrics jsonb;
// alter table public.game_sessions add column if not exists game_type text;
// ═══════════════════════════════════════════════════════════════════

const C = {
  bg: '#0F172A',
  card: '#1E293B',
  card2: '#263348',
  border: '#334155',
  accent: '#3B82F6',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: '#F1F5F9',
  sub: '#94A3B8',
  muted: '#475569',
};

const GAME_EMOJI = { hand: '✨', jump: '🚀', shadow: '🥊', gun: '🏹', aero: '🕺', flappy: '🐥' };
const GAME_COLOR = {
  hand:   { bg: '#0D9488', light: '#F0FDFA' },
  jump:   { bg: '#7C3AED', light: '#FAF5FF' },
  shadow: { bg: '#7C3AED', light: '#FAF5FF' },
  gun:    { bg: '#DC2626', light: '#FFF5F5' },
  aero:   { bg: '#059669', light: '#ECFDF5' },
  flappy: { bg: '#D4900A', light: '#FFF9E6' },
};

export default function AdminPage() {
  const [view, setView] = useState('auth'); // auth | dashboard | detail
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [doctor, setDoctor] = useState(null);

  // Auth form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard
  const [myPatients, setMyPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Detail
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem('doctor_session');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setDoctor(d);
        setView('dashboard');
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (doctor && view === 'dashboard') loadMyPatients();
  }, [doctor, view]); // eslint-disable-line

  // ─── Data functions ────────────────────────────────────────────

  const loadMyPatients = async () => {
    if (!doctor) return;
    setLoadingPatients(true);

    const { data: dpData, error: dpErr } = await supabase
      .from('doctor_patients')
      .select('patient_id')
      .eq('doctor_id', doctor.id);

    if (dpErr || !dpData || dpData.length === 0) {
      setMyPatients([]);
      setLoadingPatients(false);
      return;
    }

    const ids = dpData.map(d => d.patient_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', ids);

    setMyPatients(profilesData || []);
    setLoadingPatients(false);
  };

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    setError('');

    if (isLoginTab) {
      const { data, error: err } = await supabase
        .from('doctors')
        .select('id, username')
        .eq('username', username.trim())
        .eq('password', password)
        .single();
      setLoading(false);
      if (err || !data) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return;
      }
      const d = { id: data.id, username: data.username };
      localStorage.setItem('doctor_session', JSON.stringify(d));
      setDoctor(d);
      setView('dashboard');
    } else {
      if (password.length < 6) {
        setLoading(false);
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
      const { data, error: err } = await supabase
        .from('doctors')
        .insert([{ username: username.trim(), password }])
        .select('id, username')
        .single();
      setLoading(false);
      if (err) {
        if (err.code === '23505') setError('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
        else setError('เกิดข้อผิดพลาด: ' + err.message);
        return;
      }
      const d = { id: data.id, username: data.username };
      localStorage.setItem('doctor_session', JSON.stringify(d));
      setDoctor(d);
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctor_session');
    setDoctor(null);
    setView('auth');
    setMyPatients([]);
    setSelectedPatient(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  const loadAllPatients = async () => {
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .order('name', { ascending: true })
      .limit(100);
    setSearching(false);
    setAllPatients(data || []);
  };

  const addPatient = async (patient) => {
    if (myPatients.some(p => p.id === patient.id)) return;
    const { error: err } = await supabase
      .from('doctor_patients')
      .insert([{ doctor_id: doctor.id, patient_id: patient.id }]);
    if (!err) {
      setMyPatients(prev => [...prev, patient]);
    }
  };

  const removePatient = async (patientId) => {
    await supabase
      .from('doctor_patients')
      .delete()
      .eq('doctor_id', doctor.id)
      .eq('patient_id', patientId);
    setMyPatients(prev => prev.filter(p => p.id !== patientId));
  };

  const openPatientDetail = async (patient) => {
    setSelectedPatient(patient);
    setView('detail');
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) console.error('[admin] game_sessions query error:', error.message, error.code);
    console.log('[admin] game_sessions result:', data?.length ?? 0, 'rows for user', patient.id);
    setLoadingHistory(false);
    setGameSessions(data || []);
  };

  // ─── Style helpers ─────────────────────────────────────────────

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Group sessions by game
  const sessionsByGame = gameSessions.reduce((acc, s) => {
    if (!acc[s.game_id]) acc[s.game_id] = [];
    acc[s.game_id].push(s);
    return acc;
  }, {});

  const totalSessions = gameSessions.length;
  const wins = gameSessions.filter(s => s.win).length;
  const winRate = totalSessions > 0 ? Math.round((wins / totalSessions) * 100) : 0;

  // ═══════════════════════════════════════════════════════════════
  // VIEW: AUTH (Login / Register)
  // ═══════════════════════════════════════════════════════════════
  if (view === 'auth') {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif', padding: 16,
      }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 32, width: '100%', maxWidth: 400,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🩺</div>
            <h1 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: 0 }}>
              ระบบแพทย์
            </h1>
            <p style={{ color: C.sub, fontSize: 13, margin: '4px 0 0' }}>
              Parkinson's Helper — Doctor Portal
            </p>
          </div>

          {/* Tab */}
          <div style={{
            display: 'flex', background: C.bg, borderRadius: 8,
            padding: 3, marginBottom: 20,
          }}>
            {['เข้าสู่ระบบ', 'ลงทะเบียน'].map((label, i) => (
              <button key={i}
                onClick={() => { setIsLoginTab(i === 0); setError(''); }}
                style={{
                  flex: 1, padding: '8px', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                  background: isLoginTab === (i === 0) ? C.card : 'transparent',
                  color: isLoginTab === (i === 0) ? C.text : C.muted,
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: C.sub, fontSize: 12, marginBottom: 4, display: 'block' }}>
                ชื่อผู้ใช้
              </label>
              <input
                style={inputStyle}
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ color: C.sub, fontSize: 12, marginBottom: 4, display: 'block' }}>
                รหัสผ่าน
              </label>
              <input
                style={inputStyle}
                placeholder={isLoginTab ? 'password' : 'อย่างน้อย 6 ตัวอักษร'}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                autoComplete={isLoginTab ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '8px 12px',
              }}>
                <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              style={{
                width: '100%', padding: '11px', background: loading ? C.muted : C.accent,
                border: 'none', borderRadius: 8, color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
                marginTop: 4,
              }}>
              {loading ? 'กำลังดำเนินการ...' : isLoginTab ? 'เข้าสู่ระบบ' : 'สร้างบัญชีแพทย์'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
            <a href="/" style={{ color: C.muted, fontSize: 12, textDecoration: 'none' }}>
              ← กลับแอปผู้ป่วย
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW: PATIENT DETAIL
  // ═══════════════════════════════════════════════════════════════
  if (view === 'detail' && selectedPatient) {

    // ── Chart helper ──────────────────────────────────────────────
    const renderMiniChart = (data, color, h = 56) => {
      if (!data || data.length < 2) return null;
      const CW = 300, CH = h, pad = 6;
      const max = Math.max(...data, 1);
      const ww = CW - pad * 2, hh = CH - pad * 2;
      const pts = data.map((v, i) =>
        `${pad + (i / (data.length - 1)) * ww},${pad + hh - (v / max) * hh}`
      ).join(' ');
      const area = `${pad},${pad + hh} ${pts} ${pad + ww},${pad + hh}`;
      return (
        <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`} style={{ display: 'block' }}>
          {[0.33, 0.66, 1].map((t, i) => (
            <line key={i} x1={pad} y1={pad + hh * (1 - t)} x2={pad + ww} y2={pad + hh * (1 - t)}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}/>
          ))}
          <polygon points={area} fill={color} fillOpacity={0.18}/>
          <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round"/>
          {data.map((v, i) => (
            <circle key={i}
              cx={pad + (i / (data.length - 1)) * ww}
              cy={pad + hh - (v / max) * hh}
              r={3} fill={color} stroke={C.bg} strokeWidth={1.5}/>
          ))}
        </svg>
      );
    };

    // ── Export Report ─────────────────────────────────────────────
    const exportReport = () => {
      const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      const gameRows = Object.entries(sessionsByGame).map(([gameId, sessions]) => {
        const gWins = sessions.filter(s => s.win).length;
        const gRate = Math.round((gWins / sessions.length) * 100);
        const avgStars = (sessions.reduce((s, h) => s + (h.stars || 0), 0) / sessions.length).toFixed(1);
        const barW = gRate;
        return `
          <tr>
            <td>${GAME_EMOJI[gameId] || '🎮'} ${sessions[0]?.game_name || gameId}</td>
            <td style="text-align:center">${sessions.length}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${barW}%;background:${GAME_COLOR[gameId]?.bg || '#6B7280'};border-radius:4px"></div>
                </div>
                <span style="font-size:12px;color:#64748B;min-width:50px">${gWins}/${sessions.length} (${gRate}%)</span>
              </div>
            </td>
            <td style="text-align:center;color:#D97706">${'★'.repeat(Math.round(avgStars))}${'☆'.repeat(3 - Math.round(avgStars))} ${avgStars}</td>
          </tr>`;
      }).join('');

      const recentRows = gameSessions.slice(0, 20).map(s => {
        const gc = GAME_COLOR[s.game_id] || { bg: '#6B7280' };
        const metricsText = s.metrics
          ? Object.entries(s.metrics)
              .filter(([k]) => k !== 'reason')
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ')
          : '';
        return `
          <tr>
            <td>${GAME_EMOJI[s.game_id] || '🎮'} ${s.game_name || s.game_id}</td>
            <td style="text-align:center">${s.win ? '✅ ชนะ' : '❌ แพ้'}</td>
            <td style="text-align:center;color:#D97706">${'★'.repeat(s.stars || 0)}${'☆'.repeat(3 - (s.stars || 0))}</td>
            <td style="font-size:11px;color:#94A3B8">${metricsText}</td>
            <td style="color:#94A3B8;font-size:11px">${formatDate(s.created_at)}</td>
          </tr>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>รายงานพัฒนาการ — ${selectedPatient.name || 'ผู้ป่วย'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  *{box-sizing:border-box}
  body{font-family:'Sarabun',sans-serif;color:#1E293B;max-width:700px;margin:40px auto;padding:0 24px;font-size:14px}
  h1{color:#0F172A;border-bottom:3px solid #3B82F6;padding-bottom:12px;margin-bottom:6px;font-size:22px}
  h2{color:#1E293B;font-size:16px;margin:28px 0 10px;border-left:4px solid #3B82F6;padding-left:10px}
  .meta{color:#64748B;font-size:13px;margin-bottom:24px;display:flex;gap:24px;flex-wrap:wrap}
  .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0}
  .card{background:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;padding:16px;text-align:center}
  .card .val{font-size:28px;font-weight:700;color:#1E293B}
  .card .lbl{font-size:11px;color:#94A3B8;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin:12px 0}
  th{background:#1E293B;color:#fff;padding:9px 14px;text-align:left;font-size:12px;font-weight:600}
  td{border-bottom:1px solid #E2E8F0;padding:8px 14px;font-size:13px;vertical-align:middle}
  tr:nth-child(even) td{background:#F8FAFC}
  .footer{margin-top:40px;color:#94A3B8;font-size:11px;text-align:center;border-top:1px solid #E2E8F0;padding-top:16px}
  @media print{body{margin:20px}button{display:none}}
</style>
</head>
<body>
<h1>🩺 รายงานพัฒนาการผู้ป่วย</h1>
<div class="meta">
  <span><strong>ชื่อผู้ป่วย:</strong> ${selectedPatient.name || 'ไม่ระบุ'}</span>
  <span><strong>วันที่ออกรายงาน:</strong> ${today}</span>
  <span><strong>แพทย์ผู้ดูแล:</strong> ${doctor?.username || '-'}</span>
</div>

<div class="summary">
  <div class="card"><div class="val">${totalSessions}</div><div class="lbl">ครั้งที่เล่นทั้งหมด</div></div>
  <div class="card"><div class="val" style="color:#22C55E">${wins}</div><div class="lbl">ชนะ</div></div>
  <div class="card"><div class="val" style="color:#3B82F6">${winRate}%</div><div class="lbl">Win Rate</div></div>
</div>

<h2>📊 สรุปผลตามเกม</h2>
<table>
  <thead><tr><th>เกม</th><th>จำนวนครั้ง</th><th>Win Rate</th><th>ดาวเฉลี่ย</th></tr></thead>
  <tbody>${gameRows}</tbody>
</table>

<h2>📋 ประวัติล่าสุด (20 รายการ)</h2>
<table>
  <thead><tr><th>เกม</th><th>ผลลัพธ์</th><th>ดาว</th><th>ข้อมูลเพิ่มเติม</th><th>วันที่</th></tr></thead>
  <tbody>${recentRows}</tbody>
</table>

<div class="footer">Parkinson's Helper • สร้างโดยระบบแพทย์อัตโนมัติ • ${today}</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
    };

    // ── Pre-computed analytics ────────────────────────────────────
    const allStarsChron = [...gameSessions].reverse().map(s => s.stars || 0);

    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 40,
      }}>
        {/* Header */}
        <div style={{
          background: C.card, borderBottom: `1px solid ${C.border}`,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button
            onClick={() => setView('dashboard')}
            style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', padding: '4px 4px 4px 0', display: 'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: C.text, margin: 0, fontSize: 16 }}>👤 {selectedPatient.name || 'ไม่ระบุชื่อ'}</h2>
            <p style={{ color: C.sub, margin: 0, fontSize: 12 }}>ประวัติการเล่นเกม</p>
          </div>
          {gameSessions.length > 0 && (
            <button
              onClick={exportReport}
              style={{
                background: C.accent, border: 'none', borderRadius: 8,
                color: '#fff', padding: '8px 16px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}>
              📄 ส่งออกรายงาน
            </button>
          )}
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.sub }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <p>กำลังโหลดประวัติ...</p>
            </div>
          ) : gameSessions.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 48, color: C.sub,
              background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 16 }}>ยังไม่มีประวัติการเล่น</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                ต้องตั้งค่า table <code>game_sessions</code> ใน Supabase ก่อน
              </p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'เล่นทั้งหมด', value: totalSessions, icon: '🎮', color: C.accent  },
                  { label: 'ชนะ',         value: wins,          icon: '🏆', color: C.success },
                  { label: 'Win Rate',    value: `${winRate}%`, icon: '📊', color: C.warning },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>{s.value}</div>
                    <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Analytics Panel ── */}
              <div style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: 18, marginBottom: 16,
              }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📈 วิเคราะห์พัฒนาการ
                </div>

                {/* Overall stars trend */}
                {allStarsChron.length >= 2 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>⭐ ดาวที่ได้ตลอดเวลา (ทุกเกมรวม)</div>
                    <div style={{ background: C.card2, borderRadius: 8, padding: '10px 12px' }}>
                      {renderMiniChart(allStarsChron, C.accent, 64)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 10, marginTop: 4 }}>
                      <span>เก่าสุด</span><span>ล่าสุด →</span>
                    </div>
                  </div>
                )}

                {/* Win rate per game — horizontal bars */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>🏆 Win Rate แยกตามเกม</div>
                  {Object.entries(sessionsByGame).map(([gameId, sessions]) => {
                    const gWins = sessions.filter(s => s.win).length;
                    const gRate = Math.round((gWins / sessions.length) * 100);
                    const gc = GAME_COLOR[gameId] || { bg: '#6B7280' };
                    return (
                      <div key={gameId} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ color: C.text, fontSize: 12 }}>
                            {GAME_EMOJI[gameId] || '🎮'} {sessions[0]?.game_name || gameId}
                          </span>
                          <span style={{ color: C.sub, fontSize: 11 }}>{gWins}/{sessions.length} — {gRate}%</span>
                        </div>
                        <div style={{ height: 10, background: C.card2, borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${gRate}%`, background: gc.bg, borderRadius: 5 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Avg stars per game — bars */}
                <div>
                  <div style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>⭐ ดาวเฉลี่ยแยกตามเกม</div>
                  {Object.entries(sessionsByGame).map(([gameId, sessions]) => {
                    const avgStars = sessions.reduce((s, h) => s + (h.stars || 0), 0) / sessions.length;
                    return (
                      <div key={gameId} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ color: C.text, fontSize: 12 }}>
                            {GAME_EMOJI[gameId] || '🎮'} {sessions[0]?.game_name || gameId}
                          </span>
                          <span style={{ color: '#F59E0B', fontSize: 11 }}>
                            {'★'.repeat(Math.round(avgStars))}{'☆'.repeat(3 - Math.round(avgStars))} {avgStars.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ height: 8, background: C.card2, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(avgStars / 3) * 100}%`, background: '#F59E0B', borderRadius: 4 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-game sections with mini trend charts */}
              {Object.entries(sessionsByGame).map(([gameId, sessions]) => {
                const gc = GAME_COLOR[gameId] || { bg: '#6B7280', light: '#F9FAFB' };
                const gameWins = sessions.filter(s => s.win).length;
                const starsData = [...sessions].reverse().map(s => s.stars || 0);
                return (
                  <div key={gameId} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, overflow: 'hidden', marginBottom: 12,
                  }}>
                    {/* Game header */}
                    <div style={{
                      background: gc.bg, padding: '10px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <h3 style={{ color: '#fff', margin: 0, fontSize: 14 }}>
                        {GAME_EMOJI[gameId] || '🎮'} {sessions[0]?.game_name || gameId}
                      </h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>
                          {sessions.length} ครั้ง
                        </span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>
                          🏆 {gameWins}/{sessions.length}
                        </span>
                      </div>
                    </div>

                    {/* Mini stars trend */}
                    {starsData.length >= 2 && (
                      <div style={{ padding: '10px 14px 6px', background: C.card2 }}>
                        <div style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>⭐ trend ดาวแต่ละรอบ</div>
                        {renderMiniChart(starsData, gc.bg, 50)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 10, marginTop: 2 }}>
                          <span>รอบแรก</span><span>ล่าสุด →</span>
                        </div>
                      </div>
                    )}

                    {/* Session rows */}
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {sessions.slice(0, 8).map((s, idx) => (
                        <div key={s.id || idx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 10px', background: C.bg, borderRadius: 8,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 16 }}>{s.win ? '✅' : '❌'}</span>
                            <span style={{ color: '#F59E0B', fontSize: 13, letterSpacing: 1 }}>
                              {'⭐'.repeat(s.stars || 0)}{'☆'.repeat(3 - (s.stars || 0))}
                            </span>
                            {s.coins_earned > 0 && (
                              <span style={{ color: '#FBBF24', fontSize: 11 }}>+{s.coins_earned}🪙</span>
                            )}
                            {s.metrics && (
                              <span style={{ color: C.muted, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.metrics.final_score != null && `⭐${s.metrics.final_score}pts `}
                                {s.metrics.pipes_passed != null && `🐥×${s.metrics.pipes_passed} `}
                                {s.metrics.consistency_score != null && `🎯${s.metrics.consistency_score}% `}
                                {s.metrics.duration_secs != null && `⏱${s.metrics.duration_secs}s`}
                              </span>
                            )}
                          </div>
                          <span style={{ color: C.muted, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                            {formatDate(s.created_at)}
                          </span>
                        </div>
                      ))}
                      {sessions.length > 8 && (
                        <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', margin: '4px 0' }}>
                          + {sessions.length - 8} ครั้งก่อนหน้า
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW: DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '12px 20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🩺</span>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Doctor Portal</div>
            <div style={{ color: C.sub, fontSize: 12 }}>สวัสดี, {doctor?.username}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.sub, padding: '6px 14px',
            cursor: 'pointer', fontSize: 13,
          }}>
          ออกจากระบบ
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>

        {/* Section header + Add button */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14,
        }}>
          <h2 style={{ color: C.text, margin: 0, fontSize: 15 }}>
            คนไข้ของฉัน
            <span style={{
              marginLeft: 8, background: C.muted, color: '#fff',
              padding: '1px 8px', borderRadius: 20, fontSize: 12, fontWeight: 400,
            }}>
              {myPatients.length}
            </span>
          </h2>
          <button
            onClick={() => {
              const next = !showSearch;
              setShowSearch(next);
              setSearchQuery('');
              if (next) loadAllPatients();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showSearch ? C.muted : C.accent,
              border: 'none', borderRadius: 8, color: '#fff',
              padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
            <UserPlus size={15} />
            เพิ่มคนไข้
          </button>
        </div>

        {/* Search panel */}
        {showSearch && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 16, marginBottom: 16,
          }}>
            <p style={{ color: C.sub, fontSize: 13, margin: '0 0 10px' }}>
              ผู้ป่วยทั้งหมดในระบบ
            </p>

            {/* Filter input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Search size={15} color={C.muted} style={{ flexShrink: 0 }} />
              <input
                style={{ ...inputStyle, padding: '8px 12px' }}
                placeholder="กรองชื่อ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {searching ? (
              <p style={{ color: C.sub, fontSize: 13 }}>กำลังโหลด...</p>
            ) : (() => {
              const filtered = allPatients.filter(p =>
                !searchQuery.trim() ||
                (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
              );
              return filtered.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 13 }}>ไม่พบผู้ป่วย</p>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 5,
                  maxHeight: 280, overflowY: 'auto',
                }}>
                  {filtered.map(p => {
                    const already = myPatients.some(m => m.id === p.id);
                    return (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: C.bg, borderRadius: 8,
                      }}>
                        <span style={{ color: C.text, fontSize: 14 }}>
                          👤 {p.name || 'ไม่ระบุชื่อ'}
                        </span>
                        {already ? (
                          <span style={{ color: C.success, fontSize: 12 }}>✓ เพิ่มแล้ว</span>
                        ) : (
                          <button
                            onClick={() => addPatient(p)}
                            style={{
                              background: C.success, border: 'none', borderRadius: 6,
                              color: '#fff', padding: '5px 14px', cursor: 'pointer', fontSize: 12,
                            }}>
                            + เพิ่ม
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Patients list */}
        {loadingPatients ? (
          <div style={{ textAlign: 'center', padding: 48, color: C.sub }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <p>กำลังโหลด...</p>
          </div>
        ) : myPatients.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 48, color: C.sub,
            background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>👥</div>
            <p style={{ fontSize: 15 }}>ยังไม่มีคนไข้ในรายการ</p>
            <p style={{ fontSize: 13, color: C.muted }}>
              กดปุ่ม "เพิ่มคนไข้" เพื่อค้นหาและเพิ่มผู้ป่วย
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPatients.map(p => (
              <div key={p.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center',
              }}>
                {/* Avatar + name — clickable */}
                <button
                  onClick={() => openPatientDetail(p)}
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', textAlign: 'left', padding: 0,
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: C.card2, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 15 }}>
                      {p.name || 'ไม่ระบุชื่อ'}
                    </div>
                    <div style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>
                      ดูประวัติการเล่น →
                    </div>
                  </div>
                </button>

                {/* Remove button */}
                <button
                  onClick={() => removePatient(p.id)}
                  title="ลบออกจากรายการ"
                  style={{
                    background: 'none', border: 'none',
                    color: C.muted, cursor: 'pointer', padding: 6,
                    borderRadius: 6,
                  }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
