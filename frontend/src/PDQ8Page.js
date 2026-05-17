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
  green: '#5DCAA5',
  greenDark: '#0D9488',
  greenLight: '#F0FDFA',
};

const QUESTIONS = [
  {
    id: 1,
    text: 'มีปัญหาในการทำกิจกรรมที่ชื่นชอบ\n(เช่น งานอดิเรก กีฬา การพักผ่อน)',
    emoji: '🎯',
  },
  {
    id: 2,
    text: 'มีปัญหาในการดูแลบ้าน\n(เช่น ทำงานบ้าน ทำอาหาร ซ่อมแซมบ้าน)',
    emoji: '🏠',
  },
  {
    id: 3,
    text: 'มีปัญหาในการถือถุงของหรือของหนัก',
    emoji: '🛍️',
  },
  {
    id: 4,
    text: 'มีปัญหาในการเดินทางไกล\nประมาณ 1 กิโลเมตร หรือเดิน 15 นาที',
    emoji: '🚶',
  },
  {
    id: 5,
    text: 'มีปัญหาในการออกนอกบ้านไปสถานที่สาธารณะ\n(เช่น ตลาด ธนาคาร โรงพยาบาล)',
    emoji: '🏙️',
  },
  {
    id: 6,
    text: 'รู้สึกหดหู่ใจ เศร้า หรือสิ้นหวัง',
    emoji: '💭',
  },
  {
    id: 7,
    text: 'มีปัญหาในการมีสมาธิจดจ่อกับสิ่งต่างๆ\n(เช่น อ่านหนังสือ ดูทีวี สนทนา)',
    emoji: '🧠',
  },
  {
    id: 8,
    text: 'รู้สึกอายหรือกังวลเมื่ออยู่ในที่สาธารณะ\nเนื่องจากโรคพาร์กินสัน',
    emoji: '🤝',
  },
];

const CHOICES = [
  { value: 0, label: 'ไม่เคย', color: '#5DCAA5', bg: '#F0FDFA', border: '#5DCAA5', shadow: '#0D9488' },
  { value: 1, label: 'นานๆ ครั้ง', color: '#60A5FA', bg: '#EFF6FF', border: '#93C5FD', shadow: '#2563EB' },
  { value: 2, label: 'บางครั้ง', color: '#F9C784', bg: '#FEF3C7', border: '#F9C784', shadow: '#D4900A' },
  { value: 3, label: 'บ่อยครั้ง', color: '#F4956A', bg: '#FFF0E8', border: '#F4956A', shadow: '#C05E35' },
  { value: 4, label: 'ทำเสมอหรือทำไม่ได้เลย', color: '#F87171', bg: '#FFF5F5', border: '#FCA5A5', shadow: '#DC2626' },
];

export default function PDQ8Page({ user, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);
  const allAnswered = answeredCount === totalQuestions;
  const q = QUESTIONS[currentQ];

  const handleAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (currentQ < totalQuestions - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (!allAnswered) { setError('กรุณาตอบทุกข้อก่อนส่ง'); return; }
    setSubmitting(true);
    setError('');

    const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
    const summaryScore = Math.round((rawScore / 32) * 100);

    try {
      const { error: err } = await supabase.from('profiles').upsert({
        id: user.id,
        pdq8_completed: true,
        pdq8_score: summaryScore,
        pdq8_raw_score: rawScore,
        pdq8_answers: answers,
        pdq8_completed_at: new Date().toISOString(),
      });
      if (err) {
        console.error('PDQ-8 save error:', err);
        setError(`บันทึกไม่สำเร็จ: ${err.message}`);
        return;
      }
      onComplete(summaryScore);
    } catch (e) {
      console.error('PDQ-8 exception:', e);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  const scoreLevel = (score) => {
    if (score <= 25) return { label: 'คุณภาพชีวิตดี', color: COLORS.greenDark, bg: COLORS.greenLight };
    if (score <= 50) return { label: 'มีผลกระทบปานกลาง', color: '#D4900A', bg: '#FEF3C7' };
    if (score <= 75) return { label: 'มีผลกระทบค่อนข้างมาก', color: '#C05E35', bg: '#FFF0E8' };
    return { label: 'มีผลกระทบรุนแรง', color: '#DC2626', bg: '#FFF5F5' };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      fontFamily: FONT,
      padding: '20px 16px 40px',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          background: COLORS.orange, border: `3px solid ${COLORS.orangeDark}`,
          boxShadow: `2px 2px 0 #8B3A1A`, padding: '8px 10px',
        }}>
          <Brain size={18} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: COLORS.text, lineHeight: 2 }}>แบบสอบถาม PDQ-8</h2>
          <p style={{ margin: 0, fontSize: 9, color: COLORS.sub }}>คุณภาพชีวิตผู้ป่วยพาร์กินสัน</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: '#fff',
        border: `3px solid ${COLORS.orange}`,
        boxShadow: `inset 2px 2px 0 #FFD4B8, 3px 3px 0 ${COLORS.orangeDark}`,
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: COLORS.sub }}>ความคืบหน้า</span>
          <span style={{ fontSize: 9, color: COLORS.orangeDark, fontWeight: 700 }}>{answeredCount} / {totalQuestions} ข้อ</span>
        </div>
        <div style={{ height: 10, background: '#F5E0D0', border: `2px solid #E8C4A8` }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: COLORS.orange,
            boxShadow: `inset 0 2px 0 #FFF5EE`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center' }}>
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentQ(i)}
              style={{
                width: 10, height: 10, cursor: 'pointer',
                background: answers[i + 1] !== undefined ? COLORS.orange : (i === currentQ ? '#FFD4B8' : '#F5E0D0'),
                border: `2px solid ${i === currentQ ? COLORS.orangeDark : '#E8C4A8'}`,
                boxShadow: i === currentQ ? `1px 1px 0 ${COLORS.orangeDark}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* คำอธิบาย */}
      <div style={{
        background: COLORS.orangeLight,
        border: `3px solid ${COLORS.orange}`,
        padding: '10px 14px',
        marginBottom: 16,
        fontSize: 9,
        color: COLORS.orangeDark,
        lineHeight: 2.2,
        boxShadow: `inset 2px 2px 0 #FFF5EE`,
      }}>
        📋 ในช่วง 1 เดือนที่ผ่านมา คุณมีปัญหาต่อไปนี้บ่อยแค่ไหน?
      </div>

      {/* Current Question */}
      <div style={{
        background: '#fff',
        border: `4px solid ${COLORS.orange}`,
        boxShadow: `inset -3px -3px 0 #FFD4B8, inset 3px 3px 0 #FFF5EE, 6px 6px 0 ${COLORS.orangeDark}`,
        padding: '20px 18px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{
            background: COLORS.orangeLight,
            border: `3px solid ${COLORS.orange}`,
            boxShadow: `2px 2px 0 ${COLORS.orangeDark}`,
            padding: '8px 10px',
            fontSize: 20,
            flexShrink: 0,
          }}>
            {q.emoji}
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 9, color: COLORS.sub }}>ข้อที่ {currentQ + 1}</p>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.text, lineHeight: 2.2, whiteSpace: 'pre-line' }}>
              {q.text}
            </p>
          </div>
        </div>

        {/* Answer choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHOICES.map(choice => {
            const selected = answers[q.id] === choice.value;
            return (
              <button
                key={choice.value}
                onClick={() => handleAnswer(q.id, choice.value)}
                style={{
                  padding: '11px 14px',
                  border: `3px solid ${selected ? choice.border : '#E8C4A8'}`,
                  borderRadius: 0,
                  background: selected ? choice.bg : '#fff',
                  boxShadow: selected
                    ? `inset -2px -2px 0 ${choice.border}, inset 2px 2px 0 #fff, 3px 3px 0 ${choice.shadow}`
                    : `inset 1px 1px 0 #FFF5EE`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: FONT,
                  textAlign: 'left',
                  transform: selected ? 'translate(-1px, -1px)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 18, height: 18, flexShrink: 0,
                  border: `3px solid ${selected ? choice.border : '#E8C4A8'}`,
                  background: selected ? choice.color : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 10, color: selected ? choice.shadow : COLORS.sub, lineHeight: 2, fontWeight: selected ? 700 : 400 }}>
                  {choice.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: COLORS.sub, opacity: 0.6 }}>
                  {choice.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {currentQ > 0 && (
          <button onClick={() => setCurrentQ(c => c - 1)} style={{
            padding: '10px 16px', fontFamily: FONT, fontSize: 10,
            border: `3px solid ${COLORS.orange}`, borderRadius: 0,
            background: '#fff', color: COLORS.orangeDark, cursor: 'pointer',
            boxShadow: `2px 2px 0 ${COLORS.orangeDark}`,
          }}>
            ◀ ก่อนหน้า
          </button>
        )}
        {currentQ < totalQuestions - 1 && (
          <button onClick={() => setCurrentQ(c => c + 1)} style={{
            padding: '10px 16px', fontFamily: FONT, fontSize: 10,
            border: `3px solid ${COLORS.orange}`, borderRadius: 0,
            background: answers[q.id] !== undefined ? COLORS.orange : '#E8C4A8',
            color: answers[q.id] !== undefined ? '#fff' : COLORS.sub,
            cursor: 'pointer',
            boxShadow: answers[q.id] !== undefined ? `2px 2px 0 ${COLORS.orangeDark}` : 'none',
            marginLeft: 'auto',
          }}>
            ถัดไป ▶
          </button>
        )}
      </div>

      {/* All Questions Overview + Submit */}
      {allAnswered && (
        <div style={{
          background: COLORS.greenLight,
          border: `4px solid ${COLORS.green}`,
          boxShadow: `inset -3px -3px 0 #A7F3D0, inset 3px 3px 0 #F0FDFA, 6px 6px 0 ${COLORS.greenDark}`,
          padding: '18px 18px 20px',
          marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: COLORS.greenDark }}>✅ ตอบครบทุกข้อแล้ว!</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
            {QUESTIONS.map(qqq => {
              const ans = answers[qqq.id];
              const ch = CHOICES.find(c => c.value === ans);
              return (
                <div key={qqq.id} style={{
                  background: ch ? ch.bg : '#fff',
                  border: `2px solid ${ch ? ch.border : '#E8C4A8'}`,
                  padding: '6px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }} onClick={() => setCurrentQ(qqq.id - 1)}>
                  <p style={{ margin: 0, fontSize: 9, color: COLORS.sub }}>ข้อ {qqq.id}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: ch ? ch.shadow : COLORS.text }}>{ans}</p>
                </div>
              );
            })}
          </div>

          {error && (
            <p style={{ fontSize: 9, color: '#DC2626', marginBottom: 10, fontFamily: FONT }}>❌ {error}</p>
          )}

          <button onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: '14px',
            border: `4px solid ${COLORS.greenDark}`,
            borderRadius: 0,
            background: submitting ? '#A7F3D0' : COLORS.green,
            color: '#fff',
            fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : `inset -3px -3px 0 #A7F3D0, inset 3px 3px 0 #F0FDFA, 4px 4px 0 ${COLORS.greenDark}`,
          }}>
            {submitting ? 'กำลังบันทึก...' : '▶ ส่งแบบสอบถาม'}
          </button>
        </div>
      )}

      <p style={{ fontSize: 9, color: COLORS.sub, textAlign: 'center', lineHeight: 2 }}>
        คะแนนสูงกว่า = คุณภาพชีวิตที่ต้องการการดูแลมากขึ้น
      </p>
    </div>
  );
}
