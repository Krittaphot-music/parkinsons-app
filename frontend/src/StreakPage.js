import React, { useState, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAYS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];

function StreakPage() {
  const today = new Date();

  const [streakDays, setStreakDays] = useState(() => {
    const saved = localStorage.getItem('streakDays');
    if (saved) return new Set(JSON.parse(saved));
    const sample = [];
    for (let i = 10; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      sample.push(d.toISOString().split('T')[0]);
    }
    sample.push(today.toISOString().split('T')[0]);
    localStorage.setItem('streakDays', JSON.stringify(sample));
    return new Set(sample);
  });

  // วันที่ใช้ streak freeze (น้ำแข็ง) — 3 จุดตัวอย่าง
  const [freezeDays] = useState(() => {
    const saved = localStorage.getItem('freezeDays');
    if (saved) return new Set(JSON.parse(saved));
    const sample = [];
    ['2026-05-02', '2026-05-07'].forEach(date => sample.push(date));
    localStorage.setItem('freezeDays', JSON.stringify(sample));
    return new Set(sample);
  });

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // คำนวณ streak ปัจจุบัน
  const calcStreak = () => {
    let count = 0;
    const d = new Date(today);
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (streakDays.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  };
  const streak = calcStreak();

  // เช็ค streak วันนี้
  const todayKey = today.toISOString().split('T')[0];
  const doneToday = streakDays.has(todayKey);

  const markToday = () => {
    const updated = new Set(streakDays);
    updated.add(todayKey);
    setStreakDays(updated);
    localStorage.setItem('streakDays', JSON.stringify([...updated]));
  };

  // สร้างปฏิทิน
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // สร้าง grid วัน
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // เช็คว่าวันนี้อยู่ใน streak ต่อเนื่องไหม
  const isStreakDay = (day) => {
    if (!day) return false;
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return streakDays.has(key);
  };

  const isFreezeDay = (day) => {
    if (!day) return false;
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return freezeDays.has(key);
  };

  const isToday = (day) => {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  };

  // เช็คว่าเป็นส่วนหนึ่งของ streak ต่อเนื่อง (เพื่อวาด pill ยาว)
  const isPrevStreak = (day) => {
    if (!day || day === 1) return false;
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day-1).padStart(2,'0')}`;
    return streakDays.has(key) && isStreakDay(day);
  };
  const isNextStreak = (day) => {
    if (!day || day === daysInMonth) return false;
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day+1).padStart(2,'0')}`;
    return streakDays.has(key) && isStreakDay(day);
  };

  // rows ของปฏิทิน
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>วันต่อเนื่อง</h2>
        <button style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#9e9890', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Share2 size={15}/> <span style={{ fontSize: 13 }}>แชร์</span>
        </button>
      </div>

      {/* Streak count */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            fontSize: 80, fontWeight: 900,
            color: streak > 0 ? '#f97316' : '#444',
            lineHeight: 1,
            textShadow: streak > 0 ? '0 0 40px rgba(249,115,22,0.4)' : 'none',
          }}>
            {streak}
          </div>
          {streak > 0 && (
            <Flame size={36} color="#f97316" style={{
              position: 'absolute', top: -8, right: -32,
              filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.6))',
            }}/>
          )}
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 600, color: streak > 0 ? '#2d2a26' : '#555' }}>
          วันต่อเนื่อง!
        </p>

        {!doneToday && (
          <div style={{
            marginTop: 20,
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 32 }}>🧊</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#2d2a26' }}>อย่าลืมฝึกวันนี้!</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#9e9890' }}>เล่นเกมเพื่อรักษา streak</p>
            </div>
            <button onClick={markToday} style={{
              background: '#f97316', color: '#2d2a26', border: 'none',
              borderRadius: 10, padding: '8px 16px', fontWeight: 700,
              cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
            }}>นับวันนี้</button>
          </div>
        )}

        {doneToday && (
          <div style={{
            marginTop: 20,
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 16, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🔥</span>
            <p style={{ margin: 0, fontWeight: 600, color: '#34d399' }}>ทำแล้ววันนี้! streak ยังอยู่</p>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 20, padding: '20px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        {/* Month nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9890', padding: 6 }}>
            <ChevronLeft size={20}/>
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{MONTHS_TH[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9e9890', padding: 6 }}>
            <ChevronRight size={20}/>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {DAYS_TH.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#bbb', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar rows */}
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4, position: 'relative' }}>
            {row.map((day, di) => {
              const streakDay = isStreakDay(day);
              const freezeDay = isFreezeDay(day);
              const todayDay = isToday(day);

              return (
                <div key={di} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
                  {/* streak circle สีส้ม */}
                  {streakDay && !todayDay && (
                    <div style={{
                      position: 'absolute',
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                      boxShadow: '0 0 10px rgba(249,115,22,0.4)',
                      zIndex: 0,
                    }}/>
                  )}
                  {/* freeze circle สีฟ้าน้ำแข็ง */}
                  {freezeDay && !streakDay && !todayDay && (
                    <div style={{
                      position: 'absolute',
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                      boxShadow: '0 0 12px rgba(56,189,248,0.5)',
                      zIndex: 0,
                    }}/>
                  )}
                  {/* today circle */}
                  {todayDay && (
                    <div style={{
                      position: 'absolute',
                      width: 36, height: 36, borderRadius: '50%',
                      background: streakDay ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'rgba(129,140,248,0.2)',
                      border: '2px solid #818cf8',
                      zIndex: 0,
                    }}/>
                  )}
                  <span style={{
                    position: 'relative', zIndex: 1,
                    fontSize: 14,
                    fontWeight: streakDay || todayDay || freezeDay ? 700 : 400,
                    color: streakDay || freezeDay ? '#fff' : todayDay ? '#818cf8' : day ? '#666' : 'transparent',
                  }}>
                    {day || ''}
                  </span>
                  {/* ❄️ เล็กๆ ใต้วันน้ำแข็ง */}
                  {freezeDay && !streakDay && !todayDay && (
                    <span style={{ position: 'absolute', bottom: 1, fontSize: 8, zIndex: 2 }}>❄️</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9e9890' }}>Streak สูงสุด</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 700, color: '#f97316' }}>{Math.max(streak, 11)} 🔥</p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9e9890' }}>รวมวันที่ฝึก</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 700, color: '#c07858' }}>{streakDays.size} วัน</p>
        </div>
      </div>
    </div>
  );
}

export default StreakPage;
