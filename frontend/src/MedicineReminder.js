import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff, Clock, Check, Pencil } from 'lucide-react';

const FONT = "'Press Start 2P', monospace, 'Noto Sans Thai', sans-serif";

const C = {
  bg: '#FDF0E8', card: '#ffffff',
  border: '#F4956A', borderDark: '#C05E35',
  text: '#3D2010', sub: '#A07850',
  green: '#5DCAA5',  greenLight: '#F0FDFA',  greenDark: '#0D9488',
  orange: '#F4956A', orangeLight: '#FFF0E8', orangeDark: '#C05E35',
  purple: '#A78BFA', purpleLight: '#FAF5FF', purpleDark: '#7C3AED',
  red: '#F87171',    redLight: '#FEF2F2',    redDark: '#B91C1C',
  yellow: '#F9C784', yellowLight: '#FEF3C7', yellowDark: '#D4900A',
};

const pxBox = (bc, sd, sl, drop) => ({
  background: '#fff', border: `4px solid ${bc}`, borderRadius: 0,
  boxShadow: `inset -3px -3px 0 ${sd}, inset 3px 3px 0 ${sl}, 4px 4px 0 ${drop}`,
});

// ── Pixel Art: Capsule ────────────────────────────────────────────
function PixelCapsule({ scale = 4 }) {
  const s = scale;
  // 6×14 grid
  const B = '#1a1a1a', R = '#C62828', H = '#EF9A9A', W = '#EEEEEE', D = '#9E9E9E', T = 'transparent';
  const grid = [
    [T, B, B, B, B, T],
    [B, R, H, R, R, B],
    [B, R, H, R, R, B],
    [B, R, H, R, R, B],
    [B, R, H, R, R, B],
    [B, R, H, R, R, B],
    [B, R, H, R, R, B],
    [B, B, B, B, B, B],
    [B, W, W, W, D, B],
    [B, W, W, W, D, B],
    [B, W, W, W, D, B],
    [B, W, W, W, D, B],
    [B, W, W, W, D, B],
    [T, B, B, B, B, T],
  ];
  const cols = grid[0].length, rows = grid.length;
  return (
    <svg width={cols * s} height={rows * s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {grid.map((row, y) => row.map((color, x) =>
        color !== T ? <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={color} /> : null
      ))}
    </svg>
  );
}

// ── Pixel Art: Round Pill ─────────────────────────────────────────
function PixelRoundPill({ scale = 4 }) {
  const s = scale;
  const B = '#1a1a1a', W = '#EEEEEE', G = '#9E9E9E', T = 'transparent';
  const grid = [
    [T, T, B, B, B, B, T, T],
    [T, B, W, W, W, W, B, T],
    [B, W, W, W, W, W, W, B],
    [B, G, G, G, G, G, G, B],
    [B, W, W, W, W, W, W, B],
    [T, B, W, W, W, W, B, T],
    [T, T, B, B, B, B, T, T],
  ];
  const cols = grid[0].length, rows = grid.length;
  return (
    <svg width={cols * s} height={rows * s} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {grid.map((row, y) => row.map((color, x) =>
        color !== T ? <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={color} /> : null
      ))}
    </svg>
  );
}

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function MedicineReminder() {
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('medicines');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [form, setForm] = useState({ name: '', dose: '', time: '08:00', note: '' });
  const [takenToday, setTakenToday] = useState(() => {
    const saved = localStorage.getItem('takenToday');
    return saved ? JSON.parse(saved) : {};
  });

  // บันทึกลง localStorage ทุกครั้งที่ medicines เปลี่ยน
  useEffect(() => {
    localStorage.setItem('medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('takenToday', JSON.stringify(takenToday));
  }, [takenToday]);

  // เช็ค notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifEnabled(true);
    }
  }, []);

  // เช็คเวลาทุก 1 นาที แจ้งเตือนถ้าถึงเวลา
  useEffect(() => {
    const interval = setInterval(() => {
      if (!notifEnabled) return;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      medicines.forEach(med => {
        if (med.time === currentTime && !takenToday[med.id]) {
          new Notification('⏰ ถึงเวลากินยาแล้ว!', {
            body: `${med.name} ${med.dose}`,
            icon: '/favicon.ico',
          });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [medicines, notifEnabled, takenToday]);

  const enableNotif = async () => {
    if (!('Notification' in window)) return alert('Browser นี้ไม่รองรับการแจ้งเตือน');
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === 'granted');
  };

  const openEdit = (med) => {
    setForm({ name: med.name, dose: med.dose, time: med.time, note: med.note });
    setEditingId(med.id);
    setShowForm(true);
  };

  const addMedicine = () => {
    if (!form.name || !form.time) return;
    if (editingId) {
      // แก้ไข
      setMedicines(prev =>
        prev.map(m => m.id === editingId ? { ...m, ...form } : m)
            .sort((a, b) => a.time.localeCompare(b.time))
      );
      setEditingId(null);
    } else {
      // เพิ่มใหม่
      const newMed = { ...form, id: Date.now().toString() };
      setMedicines(prev => [...prev, newMed].sort((a, b) => a.time.localeCompare(b.time)));
    }
    setForm({ name: '', dose: '', time: '08:00', note: '' });
    setShowForm(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', dose: '', time: '08:00', note: '' });
  };

  const deleteMedicine = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    setTakenToday(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  const toggleTaken = (id) => {
    setTakenToday(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const takenCount = medicines.filter(m => takenToday[m.id]).length;

  return (
    <div style={{ fontFamily: FONT }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelCapsule scale={3} />
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.text, fontFamily: FONT, lineHeight: 1.8 }}>
            เตือนกินยา
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={enableNotif} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
            padding: '8px 14px', borderRadius: 0, cursor: 'pointer', fontSize: 8,
            border: `3px solid ${notifEnabled ? C.greenDark : '#C8B8A8'}`,
            background: notifEnabled ? C.greenLight : '#FAF6F2',
            color: notifEnabled ? C.greenDark : C.sub,
            boxShadow: `2px 2px 0 ${notifEnabled ? C.greenDark : '#A89888'}`,
          }}>
            {notifEnabled ? <Bell size={13}/> : <BellOff size={13}/>}
            {notifEnabled ? 'แจ้งเตือนเปิด' : 'เปิดแจ้งเตือน'}
          </button>
          <button onClick={() => setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
            padding: '8px 14px', borderRadius: 0, cursor: 'pointer', fontSize: 8,
            border: `3px solid ${C.borderDark}`,
            background: C.orange, color: '#fff',
            boxShadow: `2px 2px 0 #8B3A1A`,
          }}>
            <Plus size={13}/> เพิ่มยา
          </button>
        </div>
      </div>

      {/* ── Summary card ── */}
      <div style={{
        ...pxBox(C.orange, '#FFD4B8', '#FFF5EE', C.borderDark),
        padding: '18px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PixelRoundPill scale={5} />
          <div>
            <p style={{ margin: 0, fontSize: 9, color: C.sub, fontFamily: FONT, marginBottom: 8 }}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, lineHeight: 2 }}>
              กินยาแล้ว {takenCount} / {medicines.length} มื้อ
            </p>
          </div>
        </div>
        {/* pixel progress bar */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: 80, height: 16,
            border: `3px solid ${C.borderDark}`,
            boxShadow: `2px 2px 0 #8B3A1A`,
            background: '#FFF0E8', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0}%`,
              background: C.green,
            }}/>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: 9, fontWeight: 700, color: C.borderDark, fontFamily: FONT }}>
            {medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div style={{
          ...pxBox(C.purple, '#DDD6FE', '#FAF5FF', C.purpleDark),
          padding: 20, marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 11, fontWeight: 700, fontFamily: FONT, color: C.purpleDark }}>
            {editingId ? '✏ แก้ไขยา' : '+ เพิ่มยาใหม่'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'ชื่อยา *', key: 'name', ph: 'เช่น Levodopa', type: 'text' },
              { label: 'ขนาดยา', key: 'dose', ph: 'เช่น 100mg 1 เม็ด', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 9, color: C.sub, display: 'block', marginBottom: 6, fontFamily: FONT }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph} type={f.type}
                  style={{ width: '100%', background: '#FFF5EE', border: `3px solid ${C.orange}`, borderRadius: 0, padding: '8px 12px', color: C.text, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: `inset 2px 2px 0 #FFD4B8` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'เวลา *', key: 'time', ph: '', type: 'time' },
              { label: 'หมายเหตุ', key: 'note', ph: 'เช่น หลังอาหาร', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 9, color: C.sub, display: 'block', marginBottom: 6, fontFamily: FONT }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph} type={f.type}
                  style={{ width: '100%', background: '#FFF5EE', border: `3px solid ${C.orange}`, borderRadius: 0, padding: '8px 12px', color: C.text, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', boxShadow: `inset 2px 2px 0 #FFD4B8` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addMedicine} style={{
              padding: '9px 20px', background: C.orange, color: '#fff', fontFamily: FONT,
              border: `3px solid ${C.borderDark}`, borderRadius: 0, fontWeight: 700, cursor: 'pointer',
              fontSize: 9, boxShadow: `3px 3px 0 #8B3A1A`,
            }}>▶ {editingId ? 'บันทึกแก้ไข' : 'บันทึก'}</button>
            <button onClick={closeForm} style={{
              padding: '9px 20px', background: '#FAF6F2', color: C.sub, fontFamily: FONT,
              border: `3px solid #C8B8A8`, borderRadius: 0, cursor: 'pointer',
              fontSize: 9, boxShadow: `3px 3px 0 #A89888`,
            }}>✕ ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ── Medicine List ── */}
      {medicines.length === 0 ? (
        <div style={{
          ...pxBox('#C8B8A8', '#E5D5C5', '#FFF9F5', '#A89888'),
          padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
            <PixelCapsule scale={5} />
            <PixelRoundPill scale={5} />
          </div>
          <p style={{ color: C.sub, margin: 0, fontSize: 11, fontFamily: FONT, lineHeight: 2 }}>ยังไม่มียาที่บันทึกไว้</p>
          <p style={{ color: C.orange, fontSize: 9, margin: '8px 0 0 0', fontFamily: FONT }}>กด "+ เพิ่มยา" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {medicines.map((med, idx) => {
            const taken = takenToday[med.id];
            const isPast = med.time < currentTime;
            const isSoon = !isPast && med.time <= `${String(now.getHours()).padStart(2,'0')}:${String((now.getMinutes()+30)).padStart(2,'0')}`;
            const useCapsule = idx % 2 === 0;

            const cardBc  = taken ? C.green  : isSoon ? C.yellow  : C.orange;
            const cardSd  = taken ? '#A7F3D0': isSoon ? '#FDE9B8' : '#FFD4B8';
            const cardSl  = taken ? '#F0FDFA': isSoon ? '#FFFDF5' : '#FFF5EE';
            const cardDrop= taken ? C.greenDark : isSoon ? C.yellowDark : C.borderDark;

            return (
              <div key={med.id} style={{
                ...pxBox(cardBc, cardSd, cardSl, cardDrop),
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
              }}>

                {/* Pixel pill icon */}
                <div style={{ flexShrink: 0 }}>
                  {useCapsule ? <PixelCapsule scale={3} /> : <PixelRoundPill scale={4} />}
                </div>

                {/* Divider */}
                <div style={{ width: 3, alignSelf: 'stretch', background: cardBc, opacity: 0.5 }} />

                {/* Time */}
                <div style={{ textAlign: 'center', minWidth: 44 }}>
                  <Clock size={12} color={C.sub} style={{ display: 'block', margin: '0 auto 4px' }}/>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT, color: isSoon ? C.yellowDark : C.sub }}>{med.time}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: FONT, color: taken ? C.greenDark : C.text }}>{med.name}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: 9, color: C.sub, fontFamily: FONT }}>
                    {med.dose}{med.note ? ` · ${med.note}` : ''}
                  </p>
                </div>

                {/* Soon badge */}
                {isSoon && !taken && (
                  <span style={{
                    fontSize: 8, color: C.yellowDark, background: C.yellowLight,
                    border: `2px solid ${C.yellow}`, padding: '3px 7px',
                    fontFamily: FONT, boxShadow: `2px 2px 0 ${C.yellowDark}`, whiteSpace: 'nowrap',
                  }}>⏰ ใกล้แล้ว</span>
                )}
                {taken && (
                  <span style={{
                    fontSize: 8, color: C.greenDark, background: C.greenLight,
                    border: `2px solid ${C.green}`, padding: '3px 7px',
                    fontFamily: FONT, boxShadow: `2px 2px 0 ${C.greenDark}`, whiteSpace: 'nowrap',
                  }}>✓ กินแล้ว</span>
                )}

                {/* Taken */}
                <button onClick={() => toggleTaken(med.id)} style={{
                  width: 34, height: 34, border: `3px solid ${taken ? C.greenDark : '#C8B8A8'}`,
                  cursor: 'pointer', background: taken ? C.green : '#FAF6F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `2px 2px 0 ${taken ? C.greenDark : '#A89888'}`,
                }}>
                  <Check size={14} color={taken ? '#fff' : C.sub}/>
                </button>

                {/* Edit */}
                <button onClick={() => openEdit(med)} style={{
                  width: 34, height: 34, border: `3px solid ${C.orange}`,
                  cursor: 'pointer', background: C.orangeLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `2px 2px 0 ${C.borderDark}`,
                }}>
                  <Pencil size={13} color={C.borderDark}/>
                </button>

                {/* Delete */}
                <button onClick={() => deleteMedicine(med.id)} style={{
                  width: 34, height: 34, border: `3px solid ${C.redDark}`,
                  cursor: 'pointer', background: C.redLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `2px 2px 0 ${C.redDark}`,
                }}>
                  <Trash2 size={13} color={C.redDark}/>
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MedicineReminder;