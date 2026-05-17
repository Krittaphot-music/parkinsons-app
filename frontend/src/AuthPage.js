import React, { useState } from 'react';
import { supabase } from './supabase';
import { Brain } from 'lucide-react';

const FONT = "'Press Start 2P', monospace, 'Noto Sans Thai', sans-serif";
const COLORS = {
  bg: '#FDF0E8',
  orange: '#F4956A',
  orangeDark: '#C05E35',
  orangeLight: '#FFF0E8',
  text: '#3D2010',
  sub: '#A07850',
  card: '#ffffff',
};

function pxCard(bc, drop) {
  return {
    background: COLORS.card,
    border: `4px solid ${bc}`,
    boxShadow: `inset -3px -3px 0 #FFD4B8, inset 3px 3px 0 #FFF5EE, 6px 6px 0 ${drop}`,
    borderRadius: 0,
  };
}

function pxInput(focused) {
  return {
    width: '100%',
    padding: '12px 14px',
    fontSize: 13,
    fontFamily: FONT,
    color: COLORS.text,
    background: focused ? '#FFFAF6' : '#fff',
    border: `3px solid ${focused ? COLORS.orange : '#E8C4A8'}`,
    boxShadow: focused ? `inset 2px 2px 0 #FFD4B8` : `inset 2px 2px 0 #F5E0D0`,
    borderRadius: 0,
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: 0.5,
    lineHeight: 2,
  };
}

export default function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
    onAuth(data.user);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password || !name) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setLoading(false); setError(err.message); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name,
        pdq8_completed: false,
        created_at: new Date().toISOString(),
      });
    }
    setLoading(false);
    setSuccess('สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
    setTab('login');
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '10px 8px',
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 700,
    border: `3px solid ${COLORS.orange}`,
    borderRadius: 0,
    cursor: 'pointer',
    background: active ? COLORS.orange : 'transparent',
    color: active ? '#fff' : COLORS.orangeDark,
    boxShadow: active ? `inset -2px -2px 0 #FFD4B8, inset 2px 2px 0 #FFF5EE, 3px 3px 0 ${COLORS.orangeDark}` : 'none',
    letterSpacing: 0.5,
  });

  const btnStyle = {
    width: '100%',
    padding: '14px',
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    border: `4px solid ${COLORS.orangeDark}`,
    borderRadius: 0,
    background: loading ? '#E8C4A8' : COLORS.orange,
    color: loading ? COLORS.sub : '#fff',
    boxShadow: loading ? 'none' : `inset -3px -3px 0 #FFD4B8, inset 3px 3px 0 #FFF5EE, 4px 4px 0 #8B3A1A`,
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: 8,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      padding: '20px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          background: COLORS.orange,
          border: `4px solid ${COLORS.orangeDark}`,
          boxShadow: `3px 3px 0 #8B3A1A`,
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <Brain size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: 1, textAlign: 'center', lineHeight: 2 }}>
          Parkinson's Helper
        </h1>
        <p style={{ fontSize: 10, color: COLORS.sub, margin: '6px 0 0', letterSpacing: 0.5 }}>ผู้ช่วยผู้ป่วยพาร์กินสัน</p>
      </div>

      {/* Card */}
      <div style={{ ...pxCard(COLORS.orange, COLORS.orangeDark), width: '100%', maxWidth: 380, padding: '24px 24px 28px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          <button style={tabStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>
            เข้าสู่ระบบ
          </button>
          <button style={tabStyle(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}>
            สมัครสมาชิก
          </button>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            background: '#FFF0F0', border: `3px solid #FCA5A5`,
            boxShadow: `inset 2px 2px 0 #FECACA, 3px 3px 0 #DC2626`,
            padding: '10px 14px', marginBottom: 16, fontSize: 10, color: '#DC2626', fontFamily: FONT, lineHeight: 2,
          }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#F0FDF4', border: `3px solid #86EFAC`,
            boxShadow: `inset 2px 2px 0 #BBF7D0, 3px 3px 0 #16A34A`,
            padding: '10px 14px', marginBottom: 16, fontSize: 10, color: '#16A34A', fontFamily: FONT, lineHeight: 2,
          }}>
            ✅ {success}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, color: COLORS.sub, marginBottom: 6, letterSpacing: 0.5 }}>อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder="your@email.com"
                style={pxInput(focusedField === 'email')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, color: COLORS.sub, marginBottom: 6, letterSpacing: 0.5 }}>รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder="••••••••"
                style={pxInput(focusedField === 'password')}
              />
            </div>
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : '▶ เข้าสู่ระบบ'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, color: COLORS.sub, marginBottom: 6, letterSpacing: 0.5 }}>ชื่อของคุณ</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                placeholder="เช่น สมชาย ใจดี"
                style={pxInput(focusedField === 'name')}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, color: COLORS.sub, marginBottom: 6, letterSpacing: 0.5 }}>อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                placeholder="your@email.com"
                style={pxInput(focusedField === 'email')}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, color: COLORS.sub, marginBottom: 6, letterSpacing: 0.5 }}>รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                placeholder="••••••••"
                style={pxInput(focusedField === 'password')}
              />
            </div>
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'กำลังสมัครสมาชิก...' : '▶ สมัครสมาชิก'}
            </button>
          </form>
        )}
      </div>

      <p style={{ fontSize: 9, color: COLORS.sub, marginTop: 20, textAlign: 'center', lineHeight: 2 }}>
        ข้อมูลของคุณจะถูกเก็บเป็นความลับ
      </p>
    </div>
  );
}
