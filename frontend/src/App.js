import React, { useState, useRef, useEffect } from 'react';
import HandCamera from './HandCamera';
import HandGame from './HandGame';
import VoiceFlappyGame from './VoiceFlappyGame';
import ShadowGame from './ShadowGame';
import JumpGame from './JumpGame';
import GunGame from './GunGame';
import AeroGame from './AeroGame';
import MedicineReminder from './MedicineReminder';
import StreakPage from './StreakPage';
import ProfilePage from './ProfilePage';
import PixelPerson, { DEFAULT_PROFILE } from './PixelPerson';
import AuthPage from './AuthPage';
import PDQ8Page from './PDQ8Page';
import AdminPage from './AdminPage';
import { supabase } from './supabase';
import {
  Home, Hand, Gamepad2, BarChart2, Pill,
  Flame, Star, Target, Trophy,
  Brain, Rocket, Swords, Activity, Check, Clock,
  ChevronLeft, Lock, User
} from 'lucide-react';
const GAMES = [
  { id: 'aero',   name: 'AeroDance',   desc: 'เต้นอาโรบิก 4 เซต ฝึกทรงตัวและ ROM',     emoji: '🕺', bg: '#F0FFF4', color: '#059669', border: '#34D399', sdark: '#A7F3D0', slight: '#ECFDF5', drop: '#059669', levels: false, daily: true,  available: true  },
  { id: 'gun',    name: 'FaceShooter', desc: 'ฝึกกล้ามเนื้อใบหน้าและการควบคุมนิ้วมือ', emoji: '🏹', bg: '#FFF5F5', color: '#DC2626', border: '#FCA5A5', sdark: '#FECACA', slight: '#FFF5F5', drop: '#DC2626', levels: true,  daily: true,  available: true  },  
  { id: 'jump',   name: 'StarJumper',  desc: 'ฝึกการทรงตัวและการเคลื่อนไหวขา',      emoji: '🐰', bg: '#FAF5FF', color: '#7C3AED', border: '#A78BFA', sdark: '#DDD6FE', slight: '#FAF5FF', drop: '#7C3AED', levels: true,  daily: true,  available: true  },
  //{ id: 'shadow', name: 'ShadowMove',  desc: 'ฝึกการเคลื่อนไหวแขนขาและการประสานงาน', emoji: '🥊', bg: '#FAF5FF', color: '#7C3AED', border: '#A78BFA', sdark: '#DDD6FE', slight: '#FAF5FF', drop: '#7C3AED', levels: true,  daily: true,  available: true  },
  { id: 'flappy', name: 'SonicBird', desc: 'ใช้เสียงบังคับนก', emoji: '🐥', bg: '#FFF9E6', color: '#D4900A', border: '#F9C784', sdark: '#FDE9B8', slight: '#FFFDF5', drop: '#D4900A', levels: true, daily: true, available: true },
];

const COLORS = {
  bg: '#FDF0E8', card: '#ffffff', border: '#F4956A',
  text: '#3D2010', sub: '#A07850',
  pink: '#F9A8D4',   pinkLight: '#FDF2F8',   pinkDark: '#DB2777',
  blue: '#93C5FD',   blueLight: '#EFF6FF',   blueDark: '#2563EB',
  green: '#5DCAA5',  greenLight: '#F0FDFA',  greenDark: '#0D9488',
  yellow: '#F9C784', yellowLight: '#FEF3C7', yellowDark: '#D4900A',
  purple: '#A78BFA', purpleLight: '#FAF5FF', purpleDark: '#7C3AED',
  orange: '#F4956A', orangeLight: '#FFF0E8', orangeDark: '#C05E35',
};

const FONT = "'Press Start 2P', monospace, 'Noto Sans Thai', sans-serif";

const pxCard = (bc, sd, sl, drop) => ({
  background: '#fff',
  border: `4px solid ${bc}`,
  boxShadow: `inset -3px -3px 0 ${sd}, inset 3px 3px 0 ${sl}, 4px 4px 0 ${drop}`,
  borderRadius: 0,
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function useIsWide() {
  const [isWide, setIsWide] = useState(() => window.innerWidth > 1160);
  useEffect(() => {
    const handler = () => setIsWide(window.innerWidth > 1160);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isWide;
}


// Card ต้องอยู่นอก App เพื่อกัน unmount/remount เมื่อ App re-render
const Card = ({ children, style = {}, onClick, onMouseEnter, onMouseLeave }) => (
  <div
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      background: COLORS.card,
      border: `4px solid ${COLORS.border}`,
      borderRadius: 0,
      boxShadow: `inset -3px -3px 0 #FFD4B8, inset 3px 3px 0 #FFF5EE, 4px 4px 0 ${COLORS.orangeDark}`,
      ...style,
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    {children}
  </div>
);

function App() {
  const isMobile = useIsMobile();
  const isWide = useIsWide();

  // ─── Auth state ───────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pdq8Done, setPdq8Done] = useState(false);
  const [pdq8Score, setPdq8Score] = useState(null);

  useEffect(() => {
    const loadProfile = async (userId) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('pdq8_completed, pdq8_score, name')
          .eq('id', userId)
          .single();
        if (data) {
          setPdq8Done(!!data.pdq8_completed);
          setPdq8Score(data.pdq8_score);
          if (data.name) setProfile(prev => ({ ...prev, name: data.name }));
        }
      } catch (_) {}
      // migrate ประวัติเก่าจาก localStorage ขึ้น Supabase (รันครั้งเดียว)
      try {
        const migrated = localStorage.getItem('gameHistory_migrated');
        if (!migrated) {
          const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
          if (history.length > 0) {
            const sessions = history.map(h => ({
              user_id: userId,
              game_id: h.gameId,
              game_type: h.gameId,
              game_name: h.gameName,
              win: h.win,
              stars: h.stars,
              coins_earned: h.coinsEarned,
              created_at: h.timestamp,
            }));
            const { error: migErr } = await supabase.from('game_sessions').insert(sessions);
            if (migErr) {
              console.error('[migrate] game_sessions insert failed:', migErr.message);
            } else {
              localStorage.setItem('gameHistory_migrated', '1');
              console.log('[migrate] สำเร็จ:', sessions.length, 'รายการ');
            }
          } else {
            localStorage.setItem('gameHistory_migrated', '1');
          }
        }
      } catch (e) { console.error('[migrate] error:', e); }
    };

    // timeout fallback — ถ้า 5 วินาทียังไม่ได้ session ให้ไปหน้า login เลย
    const fallback = setTimeout(() => setAuthLoading(false), 5000);

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(fallback);
      if (session?.user) {
        setAuthUser(session.user);
        setAuthLoading(false);
        loadProfile(session.user.id); // load แบบ async ไม่ต้อง await
      } else {
        setAuthUser(null);
        setPdq8Done(false);
        setAuthLoading(false);
      }
    });

    return () => {
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── hooks ทั้งหมดต้องอยู่ก่อน early return ──────────────────────────────
  const [page, setPage] = useState('home');
  const [tremorScore, setTremorScore] = useState(null);
  const [tremorLevel, setTremorLevel] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [gameMode, setGameMode] = useState('hand');
  const [gameView, setGameView] = useState('hub');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [dashChartGame, setDashChartGame] = useState('jump');
  const landmarkHistory = useRef([]);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [coins, setCoins] = useState(() => {
    return parseInt(localStorage.getItem('coins') || '0', 10);
  });

  const [gameHistory, setGameHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gameHistory') || '[]'); }
    catch { return []; }
  });

  const handleGameEnd = (gameId, gameName, result) => {
    const coinsEarned = result.win ? 10 : 0;
    setCoins(prev => {
      const next = prev + coinsEarned;
      localStorage.setItem('coins', next.toString());
      return next;
    });
    const entry = {
      id: Date.now(),
      gameId, gameName,
      level: result.level,
      win: result.win,
      stars: result.stars,
      coinsEarned,
      metrics: result.metrics || null,
      timestamp: new Date().toISOString(),
    };
    setGameHistory(prev => {
      const next = [entry, ...prev].slice(0, 100);
      localStorage.setItem('gameHistory', JSON.stringify(next));
      return next;
    });
    // บันทึกขึ้น Supabase เพื่อให้แพทย์ดูได้
    if (authUser) {
      supabase.from('game_sessions').insert([{
        user_id: authUser.id,
        game_id: gameId,
        game_type: gameId,
        game_name: gameName,
        win: result.win,
        stars: result.stars,
        coins_earned: coinsEarned,
        metrics: result.metrics || null,
      }]).then(({ error }) => {
        if (error) console.error('[game_sessions] insert error:', error.message);
      });
    }
  };

  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('medicines');
    if (saved) return JSON.parse(saved);
    const sample = [
      { id: '1', name: 'Levodopa', dose: '100mg 1 เม็ด', time: '08:00', note: 'หลังอาหารเช้า' },
      { id: '2', name: 'Pramipexole', dose: '0.5mg 1 เม็ด', time: '13:00', note: 'หลังอาหารกลางวัน' },
      { id: '3', name: 'Amantadine', dose: '100mg 1 เม็ด', time: '18:00', note: 'หลังอาหารเย็น' },
    ];
    localStorage.setItem('medicines', JSON.stringify(sample));
    return sample;
  });

  const [takenToday, setTakenToday] = useState(() => {
    const saved = localStorage.getItem('takenToday');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  });

  const [showMedWidget, setShowMedWidget] = useState(false);
  const [medFading, setMedFading] = useState(false);
  const prevUpcomingLen = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      const saved = localStorage.getItem('medicines');
      if (saved) setMedicines(JSON.parse(saved));
      const savedTaken = localStorage.getItem('takenToday');
      if (savedTaken) setTakenToday(JSON.parse(savedTaken));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const upcomingMeds = medicines.filter(m => {
    const medHour = parseInt(m.time.split(':')[0]);
    const medMin = parseInt(m.time.split(':')[1]);
    const now = new Date();
    const diffMin = (medHour * 60 + medMin) - (now.getHours() * 60 + now.getMinutes());
    return diffMin >= -5 && diffMin <= 60 && !takenToday[m.id];
  });

  useEffect(() => {
    const len = upcomingMeds.length;
    if (len > 0) {
      setShowMedWidget(true);
      setMedFading(false);
      prevUpcomingLen.current = len;
      return;
    }
    if (prevUpcomingLen.current > 0 && showMedWidget) {
      prevUpcomingLen.current = 0;
      const waitTimer = setTimeout(() => {
        setMedFading(true);
        setTimeout(() => setShowMedWidget(false), 700);
      }, 5000);
      return () => clearTimeout(waitTimer);
    }
  }, [upcomingMeds.length, showMedWidget]);

  const toggleTakenHome = (id) => {
    const updated = { ...takenToday, [id]: !takenToday[id] };
    setTakenToday(updated);
    localStorage.setItem('takenToday', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setPdq8Done(false);
  };

  const handlePDQ8Complete = (score) => {
    setPdq8Done(true);
    setPdq8Score(score);
  };

  // ── Early returns (หลัง hooks ทั้งหมด) ───────────────────────────────────
  if (window.location.pathname === '/admin') return <AdminPage />;

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#FDF0E8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <div style={{
          background: '#F4956A', border: '4px solid #C05E35',
          boxShadow: '3px 3px 0 #8B3A1A', padding: '14px 16px', marginBottom: 16,
        }}>
          <Brain size={32} color="#fff" />
        </div>
        <p style={{ fontSize: 10, color: '#A07850', marginTop: 12 }}>กำลังโหลด...</p>
      </div>
    );
  }

  if (!authUser) return <AuthPage onAuth={(u) => setAuthUser(u)} />;

  const handleLandmarks = (newLandmarks) => {
    landmarkHistory.current.push(newLandmarks);
    if (landmarkHistory.current.length > 30) landmarkHistory.current.shift();
  };

  const calculateTremor = () => {
    const history = landmarkHistory.current;
    if (history.length < 2) return { score: 0, level: 'ไม่พบข้อมูล' };
    const diffs = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1]; const curr = history[i];
      let diff = 0;
      for (let j = 0; j < curr.length; j++)
        diff += Math.sqrt(Math.pow(curr[j].x - prev[j].x, 2) + Math.pow(curr[j].y - prev[j].y, 2));
      diffs.push(diff / curr.length);
    }
    const score = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length * 1000 * 100) / 100;
    let level = 'ปกติ';
    if (score >= 2 && score < 5) level = 'สั่นเล็กน้อย';
    else if (score >= 5 && score < 10) level = 'สั่นปานกลาง';
    else if (score >= 10) level = 'สั่นมาก';
    return { score, level };
  };

  const startTest = () => {
    setTremorScore(null); setTremorLevel('');
    landmarkHistory.current = [];
    let count = 10; setCountdown(count);
    const timer = setInterval(() => {
      count -= 1; setCountdown(count);
      if (count <= 0) {
        clearInterval(timer); setCountdown(null); setIsAnalyzing(true);
        const result = calculateTremor();
        setTremorScore(result.score); setTremorLevel(result.level); setIsAnalyzing(false);
      }
    }, 1000);
  };

  const streakCount = (() => {
    try {
      const s = localStorage.getItem('streakDays');
      if (!s) return 0;
      const days = new Set(JSON.parse(s));
      let c = 0; const d = new Date();
      while (days.has(d.toISOString().split('T')[0])) { c++; d.setDate(d.getDate() - 1); }
      return c;
    } catch { return 0; }
  })();


  const navItems = [
    { key: 'home',      label: 'หน้าหลัก', icon: <Home size={isMobile ? 22 : 16}/> },
    { key: 'tremor',    label: 'ตรวจมือ',  icon: <Hand size={isMobile ? 22 : 16}/> },
    { key: 'game',      label: 'เกม',      icon: <Gamepad2 size={isMobile ? 22 : 16}/> },
    { key: 'dashboard', label: 'พัฒนาการ', icon: <BarChart2 size={isMobile ? 22 : 16}/> },
    { key: 'medicine',  label: 'กินยา',    icon: <Pill size={isMobile ? 22 : 16}/> },
    { key: 'streak',    label: 'Streak',   icon: <Flame size={isMobile ? 22 : 16}/> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: FONT }}>



      <nav style={{
        background: '#FFE4D0',
        borderBottom: `4px solid ${COLORS.orange}`,
        boxShadow: `0 4px 0 ${COLORS.orangeDark}`,
        padding: isMobile ? '0 16px' : '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: isMobile ? 56 : 68,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: COLORS.orange, border: `3px solid ${COLORS.orangeDark}`,
            boxShadow: `2px 2px 0 #8B3A1A`,
            padding: '5px 6px', display: 'flex', borderRadius: 0,
          }}>
            <Brain size={20} color="#fff"/>
          </div>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: COLORS.text, fontFamily: FONT, letterSpacing: 0.5 }}>
            Parkinson's Helper
          </span>
          {isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: COLORS.yellowLight, border: `2px solid ${COLORS.yellowDark}`,
              boxShadow: `2px 2px 0 ${COLORS.yellowDark}`, padding: '3px 8px',
            }}>
              <span style={{ fontSize: 13 }}>🪙</span>
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: COLORS.yellowDark }}>{coins}</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Coin display */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: COLORS.yellowLight, border: `2px solid ${COLORS.yellowDark}`,
              boxShadow: `2px 2px 0 ${COLORS.yellowDark}`, padding: '4px 10px',
            }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: COLORS.yellowDark }}>{coins}</span>
            </div>
            {navItems.map(({ key, label, icon }) => {
              const active = page === key;
              return (
                <button key={key} onClick={() => { setPage(key); if (key === 'game') setGameView('hub'); }} style={{
                  padding: '8px 16px', borderRadius: 0,
                  border: `3px solid ${active ? COLORS.orangeDark : COLORS.orange}`,
                  cursor: 'pointer', fontSize: 11, fontFamily: FONT,
                  background: active ? COLORS.orange : 'transparent',
                  color: active ? '#fff' : COLORS.orangeDark,
                  display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: active ? `2px 2px 0 #8B3A1A` : 'none',
                  letterSpacing: 0.3,
                }}>
                  {icon}{label}
                </button>
              );
            })}
            {/* Profile / PixelPerson */}
            <div
              onClick={() => setPage('profile')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}
            >
              <div style={{
                border: `3px solid ${page === 'profile' ? COLORS.orangeDark : '#F4956A'}`,
                boxShadow: page === 'profile' ? `4px 4px 0 #8B3A1A` : 'none',
                padding: '2px 8px',
                background: page === 'profile' ? '#FFE4D0' : COLORS.orangeLight,
                display: 'inline-flex', position: 'relative', zIndex: 101,
                marginBottom: -30,
              }}>
                <img
                  src={`${process.env.PUBLIC_URL}/${profile.spriteGender === 'girl' ? 'sprites-girl' : 'sprites-boy'}/sprite_h${profile.spriteHat ?? 0}_o${profile.spriteOutfit ?? 0}_s${profile.spriteShoes ?? 0}.png`}
                  alt="ตัวละคร"
                  style={{ height: 48, imageRendering: 'pixelated', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: 9, fontFamily: FONT, color: page === 'profile' ? COLORS.orangeDark : COLORS.orangeDark, lineHeight: 1 }}>{profile.name || 'โปรไฟล์'}</span>
            </div>
          </div>
        )}
      </nav>

      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 'calc(64px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: '#FFE4D0',
          borderTop: `4px solid ${COLORS.orange}`,
          boxShadow: `0 -4px 0 ${COLORS.orangeDark}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
          overflowX: 'auto', zIndex: 100, paddingTop: 8,
        }}>
          {navItems.map(({ key, label, icon }) => {
            const active = page === key;
            return (
              <button key={key} onClick={() => { setPage(key); if (key === 'game') setGameView('hub'); }} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                border: active ? `3px solid ${COLORS.orangeDark}` : '3px solid transparent',
                background: active ? COLORS.orange : 'transparent',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 0,
                color: active ? '#fff' : COLORS.orangeDark,
                minWidth: 52, flexShrink: 0,
                boxShadow: active ? `2px 2px 0 #8B3A1A` : 'none',
                fontFamily: FONT,
              }}>
                <div style={{ padding: '2px 6px' }}>{icon}</div>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
          {/* Profile — mobile ใช้ icon ธรรมดา */}
          <button onClick={() => setPage('profile')} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            border: page === 'profile' ? `3px solid ${COLORS.orangeDark}` : '3px solid transparent',
            background: page === 'profile' ? COLORS.orange : 'transparent',
            cursor: 'pointer', padding: '4px 8px', borderRadius: 0,
            minWidth: 52, flexShrink: 0,
            boxShadow: page === 'profile' ? `2px 2px 0 #8B3A1A` : 'none',
            fontFamily: FONT,
            color: page === 'profile' ? '#fff' : COLORS.orangeDark,
          }}>
            <div style={{ padding: '2px 6px' }}><User size={22}/></div>
            <span style={{ fontSize: 11, fontWeight: page === 'profile' ? 700 : 500 }}>โปรไฟล์</span>
          </button>
        </div>
      )}

      <main style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '16px 14px' : '32px 20px' }}>

        {/* HOME */}
        {page === 'home' && (
          <div>
            <div style={{
              ...pxCard(COLORS.orange, '#FFD4B8', '#FFF5EE', COLORS.orangeDark),
              padding: isMobile ? '20px 20px' : '24px 28px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, color: COLORS.orangeDark, fontFamily: FONT, marginBottom: 10 }}>
                  🔥 สวัสดี{profile.name ? `, ${profile.name}` : ''}!
                </p>
                <h1 style={{ margin: '0 0 10px', fontSize: isMobile ? 19 : 23, fontWeight: 700, color: COLORS.text, fontFamily: FONT, lineHeight: 2 }}>วันนี้เป็นยังไงบ้าง?</h1>
                <p style={{ margin: 0, fontSize: 17, color: COLORS.sub, fontFamily: FONT, lineHeight: 2 }}>ฝึกออกกำลังกาย<br/>และติดตามพัฒนาการ</p>
              </div>
              {/* Pixel character — click to edit profile */}
              <div
                style={{ flexShrink: 0, cursor: 'pointer', filter: `drop-shadow(3px 3px 0 ${COLORS.orangeDark})` }}
                onClick={() => setPage('profile')}
                title="แก้ไขตัวละคร"
              >
                <img
                  src={`${process.env.PUBLIC_URL}/${profile.spriteGender === 'girl' ? 'sprites-girl' : 'sprites-boy'}/sprite_h${profile.spriteHat ?? 0}_o${profile.spriteOutfit ?? 0}_s${profile.spriteShoes ?? 0}.png`}
                  alt="ตัวละคร"
                  style={{
                    height: isMobile ? 130 : 160,
                    imageRendering: 'pixelated',
                    display: 'block',
                    filter: `drop-shadow(3px 3px 0 ${COLORS.orangeDark})`,
                  }}
                />
              </div>
            </div>

            {showMedWidget && (
              <Card style={{
                padding: '16px 18px', marginBottom: 16,
                opacity: medFading ? 0 : 1,
                transform: medFading ? 'translateY(-12px)' : 'translateY(0)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ background: COLORS.orangeLight, borderRadius: 10, padding: 6 }}>
                      <Pill size={14} color="#e07a30"/>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>ยาช่วงนี้</span>
                  </div>
                  <button onClick={() => setPage('medicine')} style={{
                    fontSize: 12, color: '#e07a30', background: COLORS.orangeLight,
                    border: 'none', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontWeight: 600,
                  }}>ดูทั้งหมด</button>
                </div>
                {upcomingMeds.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '8px 0', color: '#2a9d6e', fontSize: 13, fontWeight: 600 }}>
                    ✅ กินยาครบแล้ว!
                  </div>
                )}
                {upcomingMeds.map(med => {
                  const now = new Date();
                  const diffMin = (parseInt(med.time.split(':')[0]) * 60 + parseInt(med.time.split(':')[1])) - (now.getHours() * 60 + now.getMinutes());
                  const isNow = diffMin <= 0;
                  return (
                    <div key={med.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: isNow ? COLORS.orangeLight : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isNow ? COLORS.orange : COLORS.border}`,
                      borderRadius: 14, padding: '10px 14px', marginBottom: 8,
                    }}>
                      <Clock size={13} color={COLORS.sub}/>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isNow ? '#e07a30' : COLORS.sub, minWidth: 38 }}>{med.time}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: COLORS.sub }}>
                          {med.dose}
                          {isNow && <span style={{ color: '#e07a30', marginLeft: 6 }}>กินยัง?</span>}
                          {!isNow && <span style={{ marginLeft: 6 }}>อีก {diffMin} นาที</span>}
                        </p>
                      </div>
                      <button onClick={() => toggleTakenHome(med.id)} style={{
                        width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: COLORS.border, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={13} color={COLORS.sub}/>
                      </button>
                    </div>
                  );
                })}
              </Card>
            )}

            <div style={{
              ...pxCard(COLORS.yellow, '#FDE9B8', '#FFFDF5', COLORS.yellowDark),
              padding: isMobile ? '14px 16px' : '16px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 12, fontFamily: FONT, color: COLORS.yellowDark }}>⭐ ภารกิจประจำวัน</span>
                <span style={{
                  fontSize: 11, color: COLORS.yellowDark, fontFamily: FONT,
                  background: COLORS.yellowLight, border: `2px solid ${COLORS.yellow}`,
                  boxShadow: `2px 2px 0 ${COLORS.yellowDark}`, padding: '3px 8px',
                }}>0 / 3 เสร็จ</span>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {[
                  { emoji: '✨', title: 'นิ้วเวทมนตร์', pts: '+20', game: 'hand',   bc: COLORS.green,  sd: '#A7F3D0', sl: '#F0FDFA', drop: COLORS.greenDark },
                  { emoji: '🥊', title: '10ท่าพาเพลิน', pts: '+20', game: 'shadow', bc: COLORS.purple, sd: '#DDD6FE', sl: '#FAF5FF', drop: COLORS.purpleDark },
                  { emoji: '🐰', title: 'กระต่ายหรรษา', pts: '+20', game: 'jump',   bc: COLORS.orange, sd: '#FFD4B8', sl: '#FFF5EE', drop: COLORS.orangeDark },
                ].map(m => (
                  <div key={m.game} onClick={() => { setPage('game'); setGameMode(m.game); setGameView('playing'); }} style={{
                    ...pxCard(m.bc, m.sd, m.sl, m.drop),
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                  >
                    <span style={{ fontSize: 16 }}>{m.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT, color: COLORS.text }}>{m.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: COLORS.yellowDark,
                      background: COLORS.yellowLight, border: `2px solid ${COLORS.yellow}`,
                      padding: '2px 6px', fontFamily: FONT,
                    }}>{m.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.sub, marginBottom: 12, fontFamily: FONT, letterSpacing: 1 }}>▶ เมนูหลัก</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
              {[
                { icon: <Gamepad2 size={isMobile ? 22 : 26} color={COLORS.orangeDark}/>, bg: COLORS.orangeLight, bc: COLORS.orange,  sd: '#FFD4B8', sl: '#FFF5EE', drop: COLORS.orangeDark, title: 'เกมบำบัด',     desc: 'นิ้ว · เงา · กระโดด',   pg: 'game' },
                { icon: <BarChart2 size={isMobile ? 22 : 26} color={COLORS.greenDark}/>,  bg: COLORS.greenLight,  bc: COLORS.green,   sd: '#A7F3D0', sl: '#F0FDFA', drop: COLORS.greenDark,  title: 'ดูพัฒนาการ',   desc: 'ติดตาม progress',         pg: 'dashboard' },
                { icon: <Hand size={isMobile ? 22 : 26} color={COLORS.purpleDark}/>,      bg: COLORS.purpleLight, bc: COLORS.purple,  sd: '#DDD6FE', sl: '#FAF5FF', drop: COLORS.purpleDark, title: 'ตรวจอาการสั่น', desc: 'วิเคราะห์ tremor AI',    pg: 'tremor' },
                { icon: <Pill size={isMobile ? 22 : 26} color={COLORS.pinkDark}/>,        bg: COLORS.pinkLight,   bc: COLORS.pink,    sd: '#FBCFE8', sl: '#FDF2F8', drop: COLORS.pinkDark,   title: 'เตือนกินยา',   desc: 'ตั้งเวลาแจ้งเตือน',     pg: 'medicine' },
              ].map(c => (
                <div key={c.title}
                  onClick={() => { setPage(c.pg); if (c.pg === 'game') setGameView('hub'); }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `inset -3px -3px 0 ${c.sd}, inset 3px 3px 0 ${c.sl}, 6px 6px 0 ${c.drop}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `inset -3px -3px 0 ${c.sd}, inset 3px 3px 0 ${c.sl}, 4px 4px 0 ${c.drop}`; }}
                  style={{ ...pxCard(c.bc, c.sd, c.sl, c.drop), padding: isMobile ? '16px 14px' : '20px 18px', cursor: 'pointer', transition: 'transform 0.1s', position: 'relative' }}
                >
                  <div style={{ background: c.bg, border: `3px solid ${c.bc}`, boxShadow: `2px 2px 0 ${c.drop}`, padding: isMobile ? 8 : 10, display: 'inline-flex', marginBottom: 12 }}>{c.icon}</div>
                  <p style={{ margin: 0, fontSize: isMobile ? 12 : 14, fontWeight: 700, fontFamily: FONT, color: COLORS.text, lineHeight: 1.8 }}>{c.title}</p>
                  <p style={{ margin: '6px 0 0 0', fontSize: 11, color: COLORS.sub, lineHeight: 1.7, fontFamily: FONT }}>{c.desc}</p>
                  <span style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 10, color: c.drop, opacity: 0.5 }}>▶</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TREMOR */}
        {page === 'tremor' && (
          <div>
            <h2 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hand size={22}/> ตรวจอาการสั่น
            </h2>
            <Card style={{ padding: isMobile ? 16 : 24 }}>
              <HandCamera onResult={handleLandmarks}/>
              {tremorScore !== null && (
                <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 14, padding: '18px 20px', marginTop: 16, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                  <p style={{ fontSize: 44, fontWeight: 800, margin: 0, color: tremorLevel === 'ปกติ' ? '#2a9d6e' : '#e07a30' }}>{tremorScore}</p>
                  <p style={{ fontSize: 16, margin: '4px 0 0 0', color: COLORS.sub }}>{tremorLevel}</p>
                </div>
              )}
              {countdown !== null && (
                <div style={{ fontSize: 64, fontWeight: 800, color: '#c8950a', textAlign: 'center', margin: '16px 0' }}>{countdown}</div>
              )}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button onClick={startTest} disabled={isAnalyzing || countdown !== null} style={{
                  background: countdown !== null ? COLORS.border : COLORS.purple,
                  color: countdown !== null ? COLORS.sub : '#b86840',
                  border: 'none', padding: '12px 32px', borderRadius: 14,
                  fontSize: 14, fontWeight: 700, cursor: countdown !== null ? 'not-allowed' : 'pointer',
                  width: isMobile ? '100%' : 'auto',
                }}>
                  {countdown !== null ? `กำลังเก็บข้อมูล... ${countdown}` : isAnalyzing ? 'กำลังวิเคราะห์...' : 'เริ่มตรวจ 10 วินาที'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* GAME HUB */}
        {page === 'game' && (
          <div>
            {gameView === 'hub' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ background: COLORS.blueLight, borderRadius: 14, padding: 10, display: 'flex' }}>
                    <Gamepad2 size={22} color="#5b8def"/>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800 }}>เกมบำบัด</h2>
                    <p style={{ margin: 0, fontSize: 14, color: COLORS.sub }}>ฝึกทักษะผ่านเกมสนุก · ทุกวัน</p>
                  </div>
                </div>

                <div style={{
                  ...pxCard(COLORS.yellow, '#FDE9B8', '#FFFDF5', COLORS.yellowDark),
                  padding: '14px 16px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellowDark, fontFamily: FONT }}>⭐ ภารกิจวันนี้</span>
                    <span style={{ fontSize: 11, color: COLORS.sub, marginLeft: 'auto', fontFamily: FONT }}>
                      0 / {GAMES.filter(g => g.daily && g.available).length} เสร็จ
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    {GAMES.filter(g => g.daily && g.available).map(g => (
                      <div key={g.id} style={{
                        ...pxCard(g.border, g.sdark, g.slight, g.drop),
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '7px 12px', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 14 }}>{g.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text, fontFamily: FONT }}>{g.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.yellowDark, background: COLORS.yellowLight, border: `2px solid ${COLORS.yellow}`, padding: '1px 6px', fontFamily: FONT }}>+20</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12 }}>
                  {GAMES.map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        if (!g.available) return;
                        if (g.levels) { setSelectedGame(g); setSelectedLevel(1); setShowLevelModal(true); }
                        else { setGameMode(g.id); setGameView('playing'); }
                      }}
                      onMouseEnter={e => { if (g.available) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `inset -3px -3px 0 ${g.sdark}, inset 3px 3px 0 ${g.slight}, 6px 6px 0 ${g.drop}`; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `inset -3px -3px 0 ${g.sdark}, inset 3px 3px 0 ${g.slight}, 4px 4px 0 ${g.drop}`; }}
                      style={{
                        ...pxCard(g.border, g.sdark, g.slight, g.drop),
                        padding: isMobile ? '16px 14px' : '18px 16px',
                        cursor: g.available ? 'pointer' : 'default',
                        opacity: g.available ? 1 : 0.5,
                        position: 'relative',
                        transition: 'transform 0.1s',
                      }}
                    >
                      {!g.available && (
                        <div style={{ position: 'absolute', top: -2, right: 8, fontSize: 10, fontWeight: 700, color: '#8B7260', background: '#E5D5C5', border: '2px solid #C8B8A8', boxShadow: '2px 2px 0 #A89888', padding: '3px 6px', fontFamily: FONT }}>SOON</div>
                      )}
                      {g.daily && g.available && (
                        <div style={{ position: 'absolute', top: -2, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: COLORS.orange, border: `2px solid ${COLORS.orangeDark}`, boxShadow: `2px 2px 0 #8B3A1A`, padding: '3px 6px', fontFamily: FONT }}>TODAY</div>
                      )}
                      <div style={{
                        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
                        background: g.bg, border: `3px solid ${g.border}`,
                        boxShadow: `2px 2px 0 ${g.drop}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isMobile ? 22 : 26, marginBottom: 12,
                      }}>{g.emoji}</div>
                      <p style={{ margin: 0, fontSize: isMobile ? 11 : 13, fontWeight: 700, color: COLORS.text, fontFamily: FONT, lineHeight: 1.8 }}>{g.name}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: 10, color: COLORS.sub, lineHeight: 1.6, fontFamily: FONT }}>{g.desc}</p>
                      {g.levels && g.available && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          {[1,2,3].map(lv => (
                            <div key={lv} style={{ width: 8, height: 8, background: lv <= 3 ? g.color : 'rgba(0,0,0,0.12)' }}/>
                          ))}
                          <span style={{ fontSize: 10, color: COLORS.sub, marginLeft: 2, fontFamily: FONT }}>3 ด่าน</span>
                        </div>
                      )}
                      {g.available && (
                        <div style={{ marginTop: 10, display: 'inline-flex', background: g.bg, border: `2px solid ${g.border}`, padding: '4px 10px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: g.color, fontFamily: FONT }}>{g.levels ? '▲ เลือกด่าน' : '▶ เล่นเลย'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => setGameView('hub')} style={{
                    background: COLORS.card, border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, padding: '8px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  }}>
                    <ChevronLeft size={18} color={COLORS.text}/>
                  </button>
                  <div>
                    <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800 }}>
                      {GAMES.find(g => g.id === gameMode) && GAMES.find(g => g.id === gameMode).emoji} {GAMES.find(g => g.id === gameMode) && GAMES.find(g => g.id === gameMode).name}
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, color: COLORS.sub }}>
                      {GAMES.find(g => g.id === gameMode) && GAMES.find(g => g.id === gameMode).desc}
                    </p>
                  </div>
                </div>
                <Card style={{ padding: isMobile ? 12 : 20 }}>
                  {gameMode === 'hand' && <HandGame onGameEnd={(r) => handleGameEnd('hand', 'นิ้วเวทมนตร์', r)}/>}
                  {gameMode === 'shadow' && <ShadowGame onGameEnd={(r) => handleGameEnd('shadow', '10ท่าพาเพลิน', r)}/>}
                  {gameMode === 'jump' && <JumpGame startLevel={selectedLevel} onGameEnd={(r) => handleGameEnd('jump', 'กระต่ายหรรษา', r)}/>}
                  {gameMode === 'gun' && <GunGame onGameEnd={(r) => handleGameEnd('gun', 'นักธนู', r)}/>}
                  {gameMode === 'aero' && <AeroGame onGameEnd={(r) => handleGameEnd('aero', 'AeroDance', r)}/>}
                  {gameMode === 'flappy' && <VoiceFlappyGame startLevel={selectedLevel} onGameEnd={(r) => handleGameEnd('flappy', 'SonicBird', r)}/>}
                  {(gameMode === 'bird' || gameMode === 'runner') && (
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                      <div style={{ fontSize: 64, marginBottom: 16 }}>
                        {GAMES.find(g => g.id === gameMode) && GAMES.find(g => g.id === gameMode).emoji}
                      </div>
                      <p style={{ fontSize: 50, fontWeight: 700, color: COLORS.text, margin: '0 0 8px 0' }}>
                        {GAMES.find(g => g.id === gameMode) && GAMES.find(g => g.id === gameMode).name}
                      </p>
                      <p style={{ color: COLORS.sub, margin: 0, fontSize: 14 }}>กำลังพัฒนา เร็วๆ นี้! 🚧</p>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {showLevelModal && selectedGame && (
              <>
                <div onClick={() => setShowLevelModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(80,40,10,0.5)', zIndex: 200 }}/>
                <div style={{
                  position: 'fixed',
                  bottom: isMobile ? 0 : '50%',
                  left: isMobile ? 0 : '50%',
                  right: isMobile ? 0 : 'auto',
                  transform: isMobile ? 'none' : 'translate(-50%, 50%)',
                  width: isMobile ? '100%' : 420,
                  background: '#FFF9F5',
                  border: `4px solid ${selectedGame.border}`,
                  boxShadow: `inset -3px -3px 0 ${selectedGame.sdark}, inset 3px 3px 0 #fff, 6px 6px 0 ${selectedGame.drop}`,
                  borderRadius: 0,
                  padding: '20px',
                  paddingBottom: isMobile ? 'calc(28px + env(safe-area-inset-bottom))' : 20,
                  zIndex: 201,
                }}>
                  <div style={{ width: 36, height: 4, background: selectedGame.border, margin: '0 auto 16px' }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: selectedGame.bg, border: `4px solid ${selectedGame.border}`, boxShadow: `3px 3px 0 ${selectedGame.drop}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {selectedGame.emoji}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: COLORS.text, fontFamily: FONT, lineHeight: 1.8 }}>{selectedGame.name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: COLORS.sub, fontFamily: FONT }}>── SELECT STAGE ──</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { lv: 1, label: 'EASY',   stars: '★☆☆', locked: false },
                      { lv: 2, label: 'NORMAL', stars: '★★☆', locked: false },
                      { lv: 3, label: 'HARD',   stars: '★★★', locked: false },
                    ].map(item => (
                      <div
                        key={item.lv}
                        onClick={() => setSelectedLevel(item.lv)}
                        style={{
                          background: selectedLevel === item.lv && !item.locked ? selectedGame.bg : '#fff',
                          border: `3px solid ${selectedLevel === item.lv && !item.locked ? selectedGame.border : '#E8C4A8'}`,
                          boxShadow: `inset -2px -2px 0 ${selectedLevel === item.lv && !item.locked ? selectedGame.sdark : '#F0E0D0'}, inset 2px 2px 0 #fff, 3px 3px 0 ${selectedLevel === item.lv && !item.locked ? selectedGame.drop : '#C8A898'}`,
                          padding: '14px 8px', textAlign: 'center',
                          cursor: 'pointer',
                          opacity: 1,
                        }}
                      >
                        <div style={{ fontSize: item.locked ? 18 : 18, color: COLORS.text, marginBottom: 4, fontFamily: FONT }}>
                          {item.locked ? '🔒' : item.lv}
                        </div>
                        <div style={{ fontSize: 10, color: COLORS.sub, marginBottom: 5, fontFamily: FONT }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: selectedLevel === item.lv ? selectedGame.color : '#E8C4A8' }}>{item.stars}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowLevelModal(false); setGameMode(selectedGame.id); setGameView('playing'); }}
                    style={{
                      width: '100%', padding: '12px', border: `4px solid ${selectedGame.drop}`,
                      boxShadow: `inset -3px -3px 0 ${selectedGame.drop}, inset 3px 3px 0 ${selectedGame.slight}, 4px 4px 0 #3a1a08`,
                      cursor: 'pointer', background: selectedGame.color, color: '#fff',
                      fontWeight: 700, fontSize: 12, fontFamily: FONT, letterSpacing: 1,
                    }}
                  >
                    ▶ START GAME
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* DASHBOARD */}
        {page === 'dashboard' && (() => {
          const GAME_META = {
            hand:   { emoji: '✨', color: COLORS.green,  bg: COLORS.greenLight,  border: COLORS.green,  sd: '#A7F3D0', sl: '#F0FDFA', drop: COLORS.greenDark,  name: 'HandGame'    },
            shadow: { emoji: '🥊', color: COLORS.purple, bg: COLORS.purpleLight, border: COLORS.purple, sd: '#DDD6FE', sl: '#FAF5FF', drop: COLORS.purpleDark, name: 'ShadowMove'  },
            jump:   { emoji: '🚀', color: COLORS.purple, bg: COLORS.purpleLight, border: COLORS.purple, sd: '#DDD6FE', sl: '#FAF5FF', drop: COLORS.purpleDark, name: 'StarJumper'  },
            gun:    { emoji: '🏹', color: COLORS.blue,   bg: COLORS.blueLight,   border: COLORS.blue,   sd: '#BFDBFE', sl: '#EFF6FF', drop: COLORS.blueDark,   name: 'FaceShooter' },
            flappy: { emoji: '🐥', color: '#D4900A',     bg: '#FFF9E6',          border: '#F9C784',     sd: '#FDE9B8', sl: '#FFFDF5', drop: '#D4900A',         name: 'SonicBird'   },
            aero:   { emoji: '🕺', color: COLORS.green,  bg: COLORS.greenLight,  border: COLORS.green,  sd: '#A7F3D0', sl: '#F0FDFA', drop: COLORS.greenDark,  name: 'AeroDance'   },
          };
          const totalWins  = gameHistory.filter(h => h.win).length;
          const totalGames = gameHistory.length;
          const formatDate = (iso) => {
            const d = new Date(iso);
            return `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          };
          const renderStars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

          // SVG line chart
          const renderChart = (data, color, label) => {
            if (!data || data.length < 2) return (
              <p style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub, textAlign: 'center', margin: '12px 0' }}>เล่นเพิ่มอีกหน่อยเพื่อดูกราฟ!</p>
            );
            const CW = 300, CH = 68, pad = 10;
            const max = Math.max(...data, 1);
            const ww = CW - pad * 2, hh = CH - pad * 2;
            const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * ww},${pad + hh - (v / max) * hh}`).join(' ');
            const area = `${pad},${pad + hh} ${pts} ${pad + ww},${pad + hh}`;
            return (
              <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`} style={{ display: 'block' }}>
                {[0.33, 0.66, 1].map((t, i) => (
                  <line key={i} x1={pad} y1={pad + hh * (1 - t)} x2={pad + ww} y2={pad + hh * (1 - t)}
                    stroke="rgba(0,0,0,0.07)" strokeWidth={1} strokeDasharray="3 3"/>
                ))}
                <polygon points={area} fill={color} fillOpacity={0.15}/>
                <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                {data.map((v, i) => (
                  <circle key={i}
                    cx={pad + (i / (data.length - 1)) * ww}
                    cy={pad + hh - (v / max) * hh}
                    r={3.5} fill={color} stroke="white" strokeWidth={2}/>
                ))}
              </svg>
            );
          };

          // ข้อมูลเกมที่เลือก
          const cMeta      = GAME_META[dashChartGame] || GAME_META.jump;
          const cHistory   = gameHistory.filter(h => h.gameId === dashChartGame).slice(0, 20).reverse();
          const cWins      = cHistory.filter(h => h.win).length;
          const cWinRate   = cHistory.length > 0 ? Math.round((cWins / cHistory.length) * 100) : 0;
          const cAvgStars  = cHistory.length > 0
            ? (cHistory.reduce((s, h) => s + (h.stars || 0), 0) / cHistory.length).toFixed(1) : '—';
          const cScoreData = cHistory.map(h => {
            if (dashChartGame === 'jump')   return h.metrics?.final_score   ?? h.stars * 33;
            if (dashChartGame === 'flappy') return h.metrics?.pipes_passed  ?? h.stars * 3;
            return h.stars;
          });
          const cConsistencyData = cHistory
            .filter(h => h.metrics?.consistency_score != null)
            .map(h => h.metrics.consistency_score);

          return (
            <div>
              <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT }}>
                <Activity size={20}/> พัฒนาการ
              </h2>

              {/* Stats summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { icon: '🪙', label: 'Coins',       value: coins,      bc: COLORS.yellow, sd: '#FDE9B8', sl: '#FFFDF5', drop: COLORS.yellowDark },
                  { icon: '🏆', label: 'ชนะ',         value: totalWins,  bc: COLORS.green,  sd: '#A7F3D0', sl: '#F0FDFA', drop: COLORS.greenDark  },
                  { icon: '🎮', label: 'เกมทั้งหมด',  value: totalGames, bc: COLORS.blue,   sd: '#BFDBFE', sl: '#EFF6FF', drop: COLORS.blueDark   },
                ].map(s => (
                  <div key={s.label} style={{ ...pxCard(s.bc, s.sd, s.sl, s.drop), padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? 22 : 26, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontFamily: FONT, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: COLORS.text }}>{s.value}</div>
                    <div style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Analytics Chart ── */}
              <div style={{ ...pxCard(cMeta.border, cMeta.sd, cMeta.sl, cMeta.drop), padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <BarChart2 size={14} color={cMeta.color}/>
                  <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: COLORS.text }}>วิเคราะห์ผลการเล่น</span>
                </div>

                {/* Game selector tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[
                    { id: 'jump',   emoji: '🚀', name: 'StarJumper'  },
                    { id: 'flappy', emoji: '🐥', name: 'SonicBird'   },
                    { id: 'gun',    emoji: '🏹', name: 'FaceShooter' },
                    { id: 'aero',   emoji: '🕺', name: 'AeroDance'   },
                  ].map(g => {
                    const gm = GAME_META[g.id];
                    const active = dashChartGame === g.id;
                    return (
                      <button key={g.id} onClick={() => setDashChartGame(g.id)} style={{
                        background: active ? gm.color : gm.bg,
                        color: active ? '#fff' : gm.color,
                        border: `2px solid ${gm.color}`,
                        boxShadow: active ? `2px 2px 0 ${gm.drop}` : 'none',
                        padding: '4px 10px', fontFamily: FONT, fontSize: 9,
                        cursor: 'pointer', letterSpacing: 0.3,
                      }}>
                        {g.emoji} {g.name}
                      </button>
                    );
                  })}
                </div>

                {cHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{cMeta.emoji}</div>
                    <p style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub }}>ยังไม่มีข้อมูล เล่น {cMeta.name} ก่อนนะ!</p>
                  </div>
                ) : (
                  <>
                    {/* Quick stats row */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14, padding: '10px', background: 'rgba(0,0,0,0.03)', border: `1px solid ${cMeta.border}` }}>
                      {[
                        { label: 'ชนะ',         value: `${cWinRate}%`,    color: COLORS.greenDark },
                        { label: 'ดาวเฉลี่ย',   value: `${cAvgStars}★`,  color: '#D4900A'        },
                        { label: 'ครั้งที่เล่น', value: cHistory.length,  color: COLORS.text      },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: FONT, fontSize: isMobile ? 14 : 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                          <div style={{ fontFamily: FONT, fontSize: 8, color: COLORS.sub, marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Score trend */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub, marginBottom: 6 }}>
                        {dashChartGame === 'jump'   ? '📈 คะแนนแต่ละรอบ (StarJumper)'  :
                         dashChartGame === 'flappy' ? '📈 ท่อที่ผ่านได้ (SonicBird)'   :
                                                      '📈 ดาวที่ได้แต่ละรอบ'}
                      </div>
                      {renderChart(cScoreData, cMeta.color)}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 8, color: COLORS.sub, marginTop: 2 }}>
                        <span>รอบแรก</span><span>ล่าสุด →</span>
                      </div>
                    </div>

                    {/* StarJumper deep metrics — jump consistency */}
                    {dashChartGame === 'jump' && cConsistencyData.length >= 2 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `2px dashed ${COLORS.purple}` }}>
                        <div style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub, marginBottom: 6 }}>🎯 ความสม่ำเสมอในการกระโดด (%)</div>
                        {renderChart(cConsistencyData, '#a855f7')}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* History list */}
              <div style={{ ...pxCard(COLORS.orange, '#FFD4B8', '#FFF5EE', COLORS.orangeDark), padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Trophy size={16} color={COLORS.orangeDark}/>
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: COLORS.text }}>ประวัติการเล่น</span>
                  <span style={{ fontFamily: FONT, fontSize: 9, color: COLORS.sub, marginLeft: 'auto' }}>{totalGames} รายการ</span>
                </div>

                {gameHistory.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🎮</div>
                    <p style={{ fontFamily: FONT, fontSize: 10, color: COLORS.sub }}>ยังไม่มีประวัติการเล่น<br/>เริ่มเล่นเกมแล้วมาดูที่นี่!</p>
                  </div>
                )}

                {gameHistory.map((h, i) => {
                  const meta = GAME_META[h.gameId] || { emoji: '🎮', color: COLORS.orange, bg: COLORS.orangeLight };
                  return (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', marginBottom: 8,
                      background: h.win ? meta.bg : '#F8F6F4',
                      border: `2px solid ${h.win ? meta.color : '#D8C8B8'}`,
                      boxShadow: `2px 2px 0 ${h.win ? meta.color : '#C8B8A8'}`,
                    }}>
                      <div style={{
                        width: 36, height: 36, flexShrink: 0,
                        background: meta.bg, border: `2px solid ${meta.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        {meta.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontFamily: FONT, fontSize: isMobile ? 9 : 10, fontWeight: 700, color: COLORS.text }}>{h.gameName}</span>
                          {h.level && (
                            <span style={{ fontFamily: FONT, fontSize: 8, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}`, padding: '1px 4px' }}>Lv.{h.level}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: h.stars >= 3 ? '#D4900A' : h.stars >= 2 ? '#2563EB' : '#A07850' }}>
                            {renderStars(h.stars)}
                          </span>
                          <span style={{ fontFamily: FONT, fontSize: 8, color: COLORS.sub }}>{formatDate(h.timestamp)}</span>
                        </div>
                        {h.metrics && (
                          <div style={{ marginTop: 3, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {h.metrics.final_score      != null && <span style={{ fontFamily: FONT, fontSize: 7, color: COLORS.purpleDark, background: COLORS.purpleLight, padding: '1px 4px', border: `1px solid ${COLORS.purple}` }}>⭐{h.metrics.final_score}pts</span>}
                            {h.metrics.consistency_score != null && <span style={{ fontFamily: FONT, fontSize: 7, color: COLORS.greenDark,  background: COLORS.greenLight,  padding: '1px 4px', border: `1px solid ${COLORS.green}`  }}>🎯{h.metrics.consistency_score}%</span>}
                            {h.metrics.pipes_passed     != null && <span style={{ fontFamily: FONT, fontSize: 7, color: '#D4900A',          background: '#FFF9E6',          padding: '1px 4px', border: '1px solid #F9C784'             }}>🐥×{h.metrics.pipes_passed}</span>}
                            {h.metrics.duration_secs    != null && <span style={{ fontFamily: FONT, fontSize: 7, color: COLORS.sub,          background: '#f5f5f5',          padding: '1px 4px', border: '1px solid #ddd'                }}>⏱{h.metrics.duration_secs}s</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {h.win ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontFamily: FONT, fontSize: 8, color: COLORS.greenDark, background: COLORS.greenLight, border: `1px solid ${COLORS.green}`, padding: '2px 5px' }}>WIN</span>
                            <span style={{ fontFamily: FONT, fontSize: 9, color: COLORS.yellowDark, fontWeight: 700 }}>+{h.coinsEarned} 🪙</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: FONT, fontSize: 8, color: '#DC2626', background: '#FFF5F5', border: '1px solid #FCA5A5', padding: '2px 5px' }}>LOSE</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* MEDICINE */}
        {page === 'medicine' && <MedicineReminder/>}

        {/* STREAK */}
        {page === 'streak' && <StreakPage/>}

        {/* PROFILE */}
        {page === 'profile' && <ProfilePage
          profile={profile}
          setProfile={setProfile}
          authUser={authUser}
          pdq8Done={pdq8Done}
          pdq8Score={pdq8Score}
          onPdq8Complete={handlePDQ8Complete}
          onLogout={handleLogout}
        />}

      </main>
    </div>
  );
}

export default App;
