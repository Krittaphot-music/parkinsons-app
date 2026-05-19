import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// ═══════════════════════════════════════════════════════════
// SETS DATA
// ═══════════════════════════════════════════════════════════
const SETS = [
  {
    id: 1, name: 'เซต 1 – อุ่นเครื่อง', color: '#10B981', bg: '#ECFDF5',
    border: '#34D399', drop: '#059669', emoji: '🌱',
    moves: [
      { id: 'arm_shake',   name: 'สะบัดข้อมือ',    emoji: '🤚', reps: 5, desc: 'สะบัดมือสองข้างเร็วๆ ขึ้น-ลงสลับกัน' },
      { id: 'raise_hands', name: 'ยกมือขึ้น',       emoji: '🙌', reps: 5, desc: 'ยกมือสองข้างขึ้นเหนือหัว แล้วลง' },
      { id: 'side_step',   name: 'ชาร์จซ้าย-ขวา', emoji: '↔️', reps: 5, desc: 'เลื่อนสะโพกซ้าย-ขวาให้ชัดเจน' },
      { id: 'kick_lr',     name: 'เตะท้าวซ้าย-ขวา',emoji: '🦵', reps: 5, desc: 'เตะเท้าออกด้านข้างสลับซ้าย-ขวา' },
    ],
  },
  {
    id: 2, name: 'เซต 2 – เพิ่มระดับ', color: '#3B82F6', bg: '#EFF6FF',
    border: '#93C5FD', drop: '#2563EB', emoji: '⚡',
    moves: [
      { id: 'raise_hands',  name: 'ยกมือขึ้น',         emoji: '🙌', reps: 5, desc: 'ยกมือสองข้างขึ้นเหนือหัว แล้วลง' },
      { id: 'torso_twist',  name: 'บิดตัวซ้าย-ขวา',   emoji: '🔄', reps: 5, desc: 'มือสะเอว บิดลำตัวซ้าย-ขวาให้ชัด' },
      { id: 'knee_raise',   name: 'ยกเข่า',             emoji: '🦿', reps: 5, desc: 'ยกเข่าสูงสลับซ้าย-ขวา' },
      { id: 'arm_point',    name: 'แขนชี้สลับ',         emoji: '👉', reps: 5, desc: 'ชี้แขนออกด้านข้างสลับกัน' },
    ],
  },
  {
    id: 3, name: 'เซต 3 – ทำซ้ำ',    color: '#8B5CF6', bg: '#FAF5FF',
    border: '#A78BFA', drop: '#7C3AED', emoji: '🔁',
    moves: [
      { id: 'knee_bounce',  name: 'ย้ำเข่า',          emoji: '🦵', reps: 5, desc: 'ย้ำเข่าขึ้น-ลงพร้อมกันเร็วๆ' },
      { id: 'knee_touch',   name: 'ยกเข่าแตะมือ',     emoji: '🤜', reps: 5, desc: 'ยกเข่าแตะฝ่ามือข้างเดียวกัน' },
      { id: 'torso_twist',  name: 'บิดตัวซ้าย-ขวา',  emoji: '🔄', reps: 5, desc: 'มือสะเอว บิดลำตัวซ้าย-ขวาให้ชัด' },
      { id: 'arm_point',    name: 'แขนชี้สลับ',        emoji: '👉', reps: 5, desc: 'ชี้แขนออกด้านข้างสลับกัน' },
    ],
  },
  {
    id: 4, name: 'เซต 4 – ปิดท้าย',  color: '#EF4444', bg: '#FFF5F5',
    border: '#FCA5A5', drop: '#DC2626', emoji: '🏁',
    moves: [
      { id: 'punch_fwd',     name: 'ชกหน้า',          emoji: '👊', reps: 5, desc: 'ชกมือออกข้างหน้าสลับซ้าย-ขวา' },
      { id: 'arm_openclose', name: 'แขนเปิด-ปิด',    emoji: '🦅', reps: 5, desc: 'กางแขนออกกว้างแล้วหุบเข้า' },
      { id: 'knee_raise',    name: 'ยกเข่า',           emoji: '🦿', reps: 5, desc: 'ยกเข่าสูงสลับซ้าย-ขวา' },
      { id: 'arm_shake',     name: 'สะบัดข้อมือ',     emoji: '🤚', reps: 5, desc: 'สะบัดมือสองข้างเร็วๆ ซ้าย-ขวาสลับกัน' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// SKELETON ILLUSTRATION DRAWINGS
// cx, cy = center; s = scale unit (~40px)
// ═══════════════════════════════════════════════════════════
function drawStick(ctx, cx, cy, s, opts = {}) {
  const {
    headY = -1.6,
    lShoulderX = -0.6, lShoulderY = -0.9,
    rShoulderX = 0.6,  rShoulderY = -0.9,
    lElbowX = -0.8,    lElbowY = -0.3,
    rElbowX = 0.8,     rElbowY = -0.3,
    lWristX = -1.0,    lWristY = 0.3,
    rWristX = 1.0,     rWristY = 0.3,
    hipY = 0.3,
    lKneeX = -0.4,     lKneeY = 1.0,
    rKneeX = 0.4,      rKneeY = 1.0,
    lAnkleX = -0.45,   lAnkleY = 1.8,
    rAnkleX = 0.45,    rAnkleY = 1.8,
    color = '#FFFFFF',
    activeColor = '#00FF88',
    activeparts = [],
  } = opts;

  const col = (part) => activeparts.includes(part) ? activeColor : color;
  const lw = (part) => activeparts.includes(part) ? 4 : 2.5;

  const p = (x, y) => [cx + x * s, cy + y * s];
  const line = (ax, ay, bx, by, part) => {
    ctx.beginPath();
    ctx.moveTo(...p(ax, ay));
    ctx.lineTo(...p(bx, by));
    ctx.strokeStyle = col(part);
    ctx.lineWidth = lw(part);
    ctx.stroke();
  };

  ctx.lineCap = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(...p(0, headY), s * 0.28, 0, 2 * Math.PI);
  ctx.fillStyle = col('head');
  ctx.fill();

  // Neck + Torso
  line(0, headY + 0.28, 0, -0.9, 'torso');
  line(0, -0.9, 0, hipY, 'torso');

  // Hips
  line(-0.4, hipY, 0.4, hipY, 'hips');

  // Shoulders
  line(lShoulderX, lShoulderY, rShoulderX, rShoulderY, 'shoulders');

  // Left arm
  line(lShoulderX, lShoulderY, lElbowX, lElbowY, 'larm');
  line(lElbowX, lElbowY, lWristX, lWristY, 'lwrist');

  // Right arm
  line(rShoulderX, rShoulderY, rElbowX, rElbowY, 'rarm');
  line(rElbowX, rElbowY, rWristX, rWristY, 'rwrist');

  // Left leg
  line(-0.4, hipY, lKneeX, lKneeY, 'lleg');
  line(lKneeX, lKneeY, lAnkleX, lAnkleY, 'lleg');

  // Right leg
  line(0.4, hipY, rKneeX, rKneeY, 'rleg');
  line(rKneeX, rKneeY, rAnkleX, rAnkleY, 'rleg');
}

// Predefined poses for each move
const MOVE_POSES = {
  arm_shake: (ctx, cx, cy, s, frame) => {
    const shake = Math.sin(frame * 0.4) * 0.2;
    drawStick(ctx, cx, cy, s, {
      lWristX: -1.1 + shake, lWristY: 0.1,
      rWristX:  1.1 - shake, rWristY: 0.1,
      lElbowX: -0.7, lElbowY: -0.1,
      rElbowX:  0.7, rElbowY: -0.1,
      activeparts: ['lwrist', 'rwrist', 'larm', 'rarm'],
    });
    // motion arrows
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↕', cx - s * 1.3, cy);
    ctx.fillText('↕', cx + s * 1.3, cy);
  },
  foot_stomp: (ctx, cx, cy, s, frame) => {
    const raised = Math.sin(frame * 0.25) > 0;
    drawStick(ctx, cx, cy, s, {
      lKneeX: -0.4, lKneeY: raised ? 0.5 : 1.0,
      lAnkleX: -0.5, lAnkleY: raised ? 0.9 : 1.8,
      activeparts: raised ? ['lleg'] : ['rleg'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↑', cx - s * 0.5, cy + s * 0.8);
  },
  side_step: (ctx, cx, cy, s, frame) => {
    const dir = Math.sin(frame * 0.15) * 0.3;
    drawStick(ctx, cx + dir * s, cy, s, {
      activeparts: ['hips', 'lleg', 'rleg'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↔', cx, cy + s * 2);
  },
  kick_lr: (ctx, cx, cy, s, frame) => {
    const left = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lKneeX: left ? -0.9 : -0.4,
      lKneeY: left ? 1.0 : 1.0,
      lAnkleX: left ? -1.4 : -0.45,
      lAnkleY: left ? 1.0 : 1.8,
      activeparts: left ? ['lleg'] : ['rleg'],
    });
  },
  hip_sway: (ctx, cx, cy, s, frame) => {
    const sway = Math.sin(frame * 0.18) * 0.25;
    drawStick(ctx, cx, cy, s, {
      lKneeX: -0.4 + sway, rKneeX: 0.4 + sway,
      lAnkleX: -0.45 + sway, rAnkleX: 0.45 + sway,
      activeparts: ['hips'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↔', cx, cy + s * 0.5);
  },
  knee_raise: (ctx, cx, cy, s, frame) => {
    const left = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lKneeX: left ? -0.4 : -0.4,
      lKneeY: left ? 0.1 : 1.0,
      lAnkleX: left ? -0.3 : -0.45,
      lAnkleY: left ? 0.5 : 1.8,
      activeparts: left ? ['lleg'] : ['rleg'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↑', cx - s * 0.4, cy + s * 0.4);
  },
  arm_point: (ctx, cx, cy, s, frame) => {
    const left = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lWristX: left ? -1.5 : -0.6,
      lWristY: left ? -0.9 : -0.3,
      rWristX: left ? 0.6 : 1.5,
      rWristY: left ? -0.3 : -0.9,
      activeparts: left ? ['larm', 'lwrist'] : ['rarm', 'rwrist'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(left ? '←' : '→', cx, cy - s * 0.8);
  },
  knee_bounce: (ctx, cx, cy, s, frame) => {
    const bounce = Math.abs(Math.sin(frame * 0.35)) * 0.3;
    drawStick(ctx, cx, cy, s, {
      lKneeY: 1.0 - bounce,
      rKneeY: 1.0 - bounce,
      activeparts: ['lleg', 'rleg'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↑↑', cx, cy + s * 0.8);
  },
  knee_touch: (ctx, cx, cy, s, frame) => {
    const left = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lKneeX: left ? -0.35 : -0.4,
      lKneeY: left ? 0.15 : 1.0,
      lAnkleX: left ? -0.3 : -0.45,
      lAnkleY: left ? 0.6 : 1.8,
      lWristX: left ? -0.35 : -0.9,
      lWristY: left ? 0.15 : 0.3,
      activeparts: left ? ['lleg', 'larm', 'lwrist'] : ['rleg', 'rarm', 'rwrist'],
    });
  },
  punch_fwd: (ctx, cx, cy, s, frame) => {
    const left = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lWristX: left ? -0.1 : -0.9,
      lWristY: left ? -0.9 : -0.3,
      rWristX: left ? 0.9 : 0.1,
      rWristY: left ? -0.3 : -0.9,
      activeparts: left ? ['larm', 'lwrist'] : ['rarm', 'rwrist'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('👊', cx + (left ? -s * 0.1 : s * 0.1), cy - s * 0.9);
  },
  raise_hands: (ctx, cx, cy, s, frame) => {
    const h = 0.5 + Math.abs(Math.sin(frame * 0.2)) * 0.5;
    drawStick(ctx, cx, cy, s, {
      lElbowX: -0.6, lElbowY: -1.1 - h * 0.3,
      rElbowX:  0.6, rElbowY: -1.1 - h * 0.3,
      lWristX: -0.5, lWristY: -1.5 - h * 0.4,
      rWristX:  0.5, rWristY: -1.5 - h * 0.4,
      activeparts: ['larm', 'rarm', 'lwrist', 'rwrist'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `bold ${s * 0.55}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('↑  ↑', cx, cy - s * 1.7);
  },
  torso_twist: (ctx, cx, cy, s, frame) => {
    const t = Math.sin(frame * 0.18) * 0.18;
    drawStick(ctx, cx, cy, s, {
      lShoulderX: -0.6 + t, lShoulderY: -0.9,
      rShoulderX:  0.6 + t, rShoulderY: -0.9,
      lElbowX: -0.65 + t, lElbowY: 0.05,
      rElbowX:  0.65 + t, rElbowY: 0.05,
      lWristX: -0.5 + t, lWristY: 0.3,
      rWristX:  0.5 + t, rWristY: 0.3,
      activeparts: ['shoulders', 'larm', 'rarm', 'torso'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `bold ${s * 0.55}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t > 0 ? '→' : '←', cx, cy - s * 0.2);
  },
  arm_openclose: (ctx, cx, cy, s, frame) => {
    const open = Math.sin(frame * 0.2) > 0;
    drawStick(ctx, cx, cy, s, {
      lWristX: open ? -1.5 : -0.3,
      lWristY: open ? -0.5 : -0.5,
      rWristX: open ?  1.5 : 0.3,
      rWristY: open ? -0.5 : -0.5,
      lElbowX: open ? -1.0 : -0.4,
      lElbowY: open ? -0.7 : -0.6,
      rElbowX: open ?  1.0 : 0.4,
      rElbowY: open ? -0.7 : -0.6,
      activeparts: ['larm', 'rarm', 'lwrist', 'rwrist'],
    });
    ctx.fillStyle = '#00FF88';
    ctx.font = `${s * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(open ? '◀ ▶' : '▶ ◀', cx, cy - s * 0.3);
  },
};

// ═══════════════════════════════════════════════════════════
// MOVEMENT DETECTORS
// ═══════════════════════════════════════════════════════════
function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

const DETECTORS = {
  // สะบัดข้อมือ: wrist oscillates up-down alternating (tracks wrist Y)
  arm_shake(lm, s) {
    const lw = lm[15], rw = lm[16];
    const avgY = (lw.y + rw.y) / 2;
    if (!s) return { rep: false, newState: { baseY: avgY, lastY: avgY, lastDir: 0, swings: 0, cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    const dy = avgY - s.lastY;
    const dir = dy > 0.012 ? 1 : dy < -0.012 ? -1 : s.lastDir;
    let swings = s.swings;
    let rep = false;
    if (dir !== 0 && dir !== s.lastDir && s.lastDir !== 0) {
      swings++;
      if (swings >= 2) { rep = true; swings = 0; }
    }
    return { rep, newState: { baseY: avgY, lastY: avgY, lastDir: dir, swings, cd: rep ? 18 : 0 }, active: swings > 0 };
  },

  // ยกมือขึ้น: both wrists above shoulders then return
  raise_hands(lm, s) {
    const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
    const bothUp = lw.y < ls.y - 0.08 && rw.y < rs.y - 0.08;
    if (!s) return { rep: false, newState: { phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };
    let { phase } = s; let rep = false;
    if (phase === 'idle' && bothUp) { phase = 'up'; }
    else if (phase === 'up' && !bothUp) { phase = 'idle'; rep = true; }
    return { rep, newState: { phase, cd: rep ? 20 : 0 }, active: phase === 'up' };
  },

  // บิดตัว: shoulder midpoint shifts vs hip midpoint (left-right twist)
  torso_twist(lm, s) {
    const sX = (lm[11].x + lm[12].x) / 2;
    const hX = (lm[23].x + lm[24].x) / 2;
    const offset = sX - hX;
    if (!s) return { rep: false, newState: { base: offset, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };
    let { base, phase } = s; let rep = false;
    const dx = offset - base;
    if (phase === 'idle' && Math.abs(dx) > 0.05) { phase = dx > 0 ? 'R' : 'L'; }
    else if (phase === 'R' && dx < -0.05) { rep = true; phase = 'L'; }
    else if (phase === 'L' && dx > 0.05) { rep = true; phase = 'R'; }
    else if (phase !== 'idle' && Math.abs(dx) < 0.02) { phase = 'idle'; }
    return { rep, newState: { base, phase, cd: rep ? 12 : 0 }, active: phase !== 'idle' };
  },

  foot_stomp(lm, s) {
    const ankY = (lm[27].y + lm[28].y) / 2;
    const hipY = (lm[23].y + lm[24].y) / 2;
    if (!s) return { rep: false, newState: { baseY: ankY, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    const span = Math.max(0.01, Math.abs(ankY - hipY));
    const thr = span * 0.10;
    let { baseY, phase } = s;
    let rep = false;

    if (phase === 'idle' && ankY < baseY - thr) { phase = 'up'; }
    else if (phase === 'up' && ankY > baseY - thr * 0.3) { phase = 'idle'; rep = true; }

    const newBase = phase === 'idle' ? baseY * 0.96 + ankY * 0.04 : baseY;
    return { rep, newState: { baseY: newBase, phase, cd: rep ? 15 : 0 }, active: phase === 'up' };
  },

  side_step(lm, s) {
    const hipX = (lm[23].x + lm[24].x) / 2;
    if (!s) return { rep: false, newState: { baseX: hipX, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { baseX, phase } = s;
    let rep = false;
    const dx = hipX - baseX;

    if (phase === 'idle' && Math.abs(dx) > 0.07) { phase = dx > 0 ? 'R' : 'L'; }
    else if (phase !== 'idle' && Math.abs(dx) < 0.03) { phase = 'idle'; rep = true; }

    return { rep, newState: { baseX, phase, cd: rep ? 15 : 0 }, active: phase !== 'idle' };
  },

  kick_lr(lm, s) {
    if (!s) return { rep: false, newState: { phase: 'idle', side: 'L', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { phase, side } = s;
    let rep = false;
    const la = lm[27], ra = lm[28], lh = lm[23], rh = lm[24];

    if (phase === 'idle') {
      if (side === 'L' && la.x < lh.x - 0.10) phase = 'kick';
      if (side === 'R' && ra.x > rh.x + 0.10) phase = 'kick';
    } else {
      const returned = side === 'L' ? la.x > lh.x - 0.03 : ra.x < rh.x + 0.03;
      if (returned) { phase = 'idle'; rep = true; side = side === 'L' ? 'R' : 'L'; }
    }
    return { rep, newState: { phase, side, cd: rep ? 15 : 0 }, active: phase === 'kick' };
  },

  hip_sway(lm, s) {
    const hipX = (lm[23].x + lm[24].x) / 2;
    if (!s) return { rep: false, newState: { baseX: hipX, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { baseX, phase } = s;
    let rep = false;
    const dx = hipX - baseX;

    if (phase === 'idle' && Math.abs(dx) > 0.06) { phase = dx > 0 ? 'R' : 'L'; }
    else if (phase === 'R' && dx < -0.06) { rep = true; phase = 'L'; }
    else if (phase === 'L' && dx > 0.06) { rep = true; phase = 'R'; }
    else if (phase !== 'idle' && Math.abs(dx) < 0.02) { phase = 'idle'; }

    return { rep, newState: { baseX, phase, cd: rep ? 10 : 0 }, active: phase !== 'idle' };
  },

  knee_raise(lm, s) {
    if (!s) return { rep: false, newState: { phase: 'idle', side: 'L', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { phase, side } = s;
    let rep = false;
    const knee = side === 'L' ? lm[25] : lm[26];
    const hip  = side === 'L' ? lm[23] : lm[24];

    if (phase === 'idle' && knee.y < hip.y - 0.09) { phase = 'raised'; }
    else if (phase === 'raised' && knee.y > hip.y - 0.03) {
      phase = 'idle'; rep = true; side = side === 'L' ? 'R' : 'L';
    }
    return { rep, newState: { phase, side, cd: rep ? 15 : 0 }, active: phase === 'raised' };
  },

  arm_point(lm, s) {
    if (!s) return { rep: false, newState: { phase: 'idle', side: 'L', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { phase, side } = s;
    let rep = false;
    const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];

    if (phase === 'idle') {
      if (side === 'L' && lw.x < ls.x - 0.13) phase = 'pointing';
      if (side === 'R' && rw.x > rs.x + 0.13) phase = 'pointing';
    } else {
      const wrist = side === 'L' ? lw : rw;
      const shldr = side === 'L' ? ls : rs;
      if (Math.abs(wrist.x - shldr.x) < 0.07) { phase = 'idle'; rep = true; side = side === 'L' ? 'R' : 'L'; }
    }
    return { rep, newState: { phase, side, cd: rep ? 15 : 0 }, active: phase === 'pointing' };
  },

  knee_bounce(lm, s) {
    const kY = (lm[25].y + lm[26].y) / 2;
    const hY = (lm[23].y + lm[24].y) / 2;
    if (!s) return { rep: false, newState: { baseY: kY, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    const span = Math.max(0.01, Math.abs(kY - hY));
    const thr = span * 0.12;
    let { baseY, phase } = s;
    let rep = false;

    if (phase === 'idle' && kY < baseY - thr) { phase = 'up'; }
    else if (phase === 'up' && kY > baseY - thr * 0.3) { phase = 'idle'; rep = true; }

    const newBase = phase === 'idle' ? baseY * 0.97 + kY * 0.03 : baseY;
    return { rep, newState: { baseY: newBase, phase, cd: rep ? 12 : 0 }, active: phase === 'up' };
  },

  knee_touch(lm, s) {
    if (!s) return { rep: false, newState: { phase: 'idle', side: 'L', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { phase, side } = s;
    let rep = false;
    const knee  = side === 'L' ? lm[25] : lm[26];
    const wrist = side === 'L' ? lm[15] : lm[16];
    const d = dist2D(knee, wrist);

    if (phase === 'idle' && d < 0.10) { phase = 'touched'; }
    else if (phase === 'touched' && d > 0.18) { phase = 'idle'; rep = true; side = side === 'L' ? 'R' : 'L'; }

    return { rep, newState: { phase, side, cd: rep ? 15 : 0 }, active: phase === 'touched' };
  },

  punch_fwd(lm, s) {
    const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
    if (!s) return { rep: false, newState: { phase: 'idle', side: 'L', prevLwY: lw.y, prevRwY: rw.y, cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { phase, side } = s;
    let rep = false;

    const wrist  = side === 'L' ? lw : rw;
    const shldr  = side === 'L' ? ls : rs;
    const prevWY = side === 'L' ? s.prevLwY : s.prevRwY;
    const vel    = Math.abs(wrist.y - prevWY);

    if (phase === 'idle') {
      if (Math.abs(wrist.y - shldr.y) < 0.20 && vel > 0.012) phase = 'punching';
    } else {
      if (vel < 0.005) { phase = 'idle'; rep = true; side = side === 'L' ? 'R' : 'L'; }
    }
    return { rep, newState: { phase, side, prevLwY: lw.y, prevRwY: rw.y, cd: rep ? 15 : 0 }, active: phase === 'punching' };
  },

  arm_openclose(lm, s) {
    const d = dist2D(lm[15], lm[16]);
    if (!s) return { rep: false, newState: { baseD: d, phase: 'idle', cd: 0 }, active: false };
    if (s.cd > 0) return { rep: false, newState: { ...s, cd: s.cd - 1 }, active: false };

    let { baseD, phase } = s;
    let rep = false;

    if (phase === 'idle' && d > baseD + 0.20) { phase = 'open'; }
    else if (phase === 'open' && d < baseD + 0.06) { phase = 'idle'; rep = true; }

    const newBase = phase === 'idle' ? baseD * 0.95 + d * 0.05 : baseD;
    return { rep, newState: { baseD: newBase, phase, cd: rep ? 15 : 0 }, active: phase === 'open' };
  },
};

// ═══════════════════════════════════════════════════════════
// SKELETON DRAW FOR CAMERA VIEW
// ═══════════════════════════════════════════════════════════
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[25,27],[24,26],[26,28],
];
const JOINT_IDS = [11,12,13,14,15,16,23,24,25,26,27,28];

function drawSkeleton(ctx, lm, W, H, color) {
  if (!lm || lm.length < 29) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  POSE_CONNECTIONS.forEach(([a, b]) => {
    if (lm[a]?.visibility > 0.3 && lm[b]?.visibility > 0.3) {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * W, lm[a].y * H);
      ctx.lineTo(lm[b].x * W, lm[b].y * H);
      ctx.stroke();
    }
  });
  ctx.fillStyle = '#FFFFFF';
  JOINT_IDS.forEach(i => {
    if (lm[i]?.visibility > 0.3) {
      ctx.beginPath();
      ctx.arc(lm[i].x * W, lm[i].y * H, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════
// PIXEL CARD STYLE (match app theme)
// ═══════════════════════════════════════════════════════════
const pxCard = (bc, drop, sd = '#fff', sl = '#fff') => ({
  background: '#fff',
  border: `4px solid ${bc}`,
  boxShadow: `inset -3px -3px 0 ${sd}, inset 3px 3px 0 ${sl}, 4px 4px 0 ${drop}`,
  borderRadius: 0,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
function AeroGame({ onGameEnd }) {
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const skelCanvasRef  = useRef(null); // illustration canvas
  const poseLandmarkerRef = useRef(null);
  const animFrameRef   = useRef(null);
  const frameRef       = useRef(0); // for animation

  const gameStateRef    = useRef('select');
  const currentMoveRef  = useRef(0);
  const currentRepsRef  = useRef(0);
  const detStateRef     = useRef({});
  const activeRef       = useRef(false);
  const completedRef    = useRef(0);
  const moveStartRef    = useRef(null);
  const responseTimesRef= useRef([]);
  const cdIntervalRef   = useRef(null);
  const selectedSetRef  = useRef(null);

  const [modelReady,  setModelReady]  = useState(false);
  const [status,      setStatus]      = useState('กำลังโหลด AI...');
  const [gameState,   setGameState]   = useState('select');
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentMove, setCurrentMove] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [countdown,   setCountdown]   = useState(3);
  const [isActive,    setIsActive]    = useState(false);
  const [moveFlash,   setMoveFlash]   = useState(false);
  const [finalRes,    setFinalRes]    = useState(null);
  const W = 640, H = 480;

  // ── MediaPipe setup ──────────────────────────────────────
  useEffect(() => {
    let destroyed = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        const pl = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO', numPoses: 1,
        });
        if (destroyed) { pl.close(); return; }
        poseLandmarkerRef.current = pl;
        setStatus('');
        setModelReady(true);
      } catch { setStatus('ไม่สามารถโหลด AI ได้'); }
    })();
    return () => { destroyed = true; };
  }, []);

  // ── Camera ───────────────────────────────────────────────
  useEffect(() => {
    if (!modelReady) return;
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: W, height: H }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      } catch { setStatus('ไม่สามารถเปิดกล้องได้'); }
    })();
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [modelReady]);

  // ── Animation loop ───────────────────────────────────────
  useEffect(() => {
    if (!modelReady) return;
    let lastMs = 0;
    const loop = (now) => {
      animFrameRef.current = requestAnimationFrame(loop);
      frameRef.current++;

      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (now - lastMs < 33) return;
      lastMs = now;

      const result = poseLandmarkerRef.current?.detectForVideo(videoRef.current, now);
      const lm = result?.landmarks?.[0];

      // ── Camera canvas ──────────────────────────────────
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W, 0); ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, W, H);
      ctx.restore();

      if (lm) {
        const dispLm = lm.map(p => ({ ...p, x: 1 - p.x }));
        const playing = gameStateRef.current === 'playing';
        drawSkeleton(ctx, dispLm, W, H,
          activeRef.current ? '#00FF88' : '#88AAFF');

        if (playing && selectedSetRef.current !== null) {
          const set  = SETS[selectedSetRef.current];
          const mi   = currentMoveRef.current;
          const move = set?.moves[mi];
          if (move && DETECTORS[move.id]) {
            const key = `${selectedSetRef.current}_${mi}`;
            const det = DETECTORS[move.id](lm, detStateRef.current[key]);
            detStateRef.current[key] = det.newState;
            activeRef.current = det.active;
            setIsActive(det.active);

            if (det.rep) {
              if (currentRepsRef.current === 0 && moveStartRef.current)
                responseTimesRef.current.push(Date.now() - moveStartRef.current);
              const newReps = currentRepsRef.current + 1;
              currentRepsRef.current = newReps;
              setCurrentReps(newReps);
              setMoveFlash(true);
              setTimeout(() => setMoveFlash(false), 200);
              if (newReps >= move.reps) {
                completedRef.current++;
                advanceMove();
              }
            }
          }
        }
      }

      // ── Skeleton illustration canvas ──────────────────
      const sk = skelCanvasRef.current;
      const skelVisible = gameStateRef.current === 'playing' || gameStateRef.current === 'countdown';
      if (sk && skelVisible && selectedSetRef.current !== null) {
        const sCtx = sk.getContext('2d');
        sCtx.clearRect(0, 0, sk.width, sk.height);
        // dark bg
        sCtx.fillStyle = '#1a1a2e';
        sCtx.fillRect(0, 0, sk.width, sk.height);

        const set  = SETS[selectedSetRef.current];
        const move = set?.moves[currentMoveRef.current];
        if (move && MOVE_POSES[move.id]) {
          MOVE_POSES[move.id](sCtx, sk.width / 2, sk.height * 0.55, 28, frameRef.current);
        }
        // label
        sCtx.fillStyle = '#aaa';
        sCtx.font = 'bold 11px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText('ทำท่าตามนี้', sk.width / 2, 16);
        if (move) {
          sCtx.fillStyle = '#fff';
          sCtx.font = 'bold 13px sans-serif';
          sCtx.fillText(`${move.emoji} ${move.name}`, sk.width / 2, sk.height - 20);
          sCtx.fillStyle = '#00FF88';
          sCtx.font = '10px sans-serif';
          sCtx.fillText(move.desc, sk.width / 2, sk.height - 6);
        }
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [modelReady]); // eslint-disable-line

  // ── Game helpers ─────────────────────────────────────────
  const endGame = useCallback(() => {
    gameStateRef.current = 'done';
    setGameState('done');
    const done = completedRef.current;
    const set  = selectedSetRef.current !== null ? SETS[selectedSetRef.current] : null;
    const total = set ? set.moves.length : 1;
    const rate = Math.round((done / total) * 100);
    const rts  = responseTimesRef.current;
    const avgRT = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
    setFinalRes({ rate, done, total, avgRT });
    if (onGameEnd) onGameEnd({
      win: rate >= 60, stars: rate >= 90 ? 3 : rate >= 70 ? 2 : 1, level: 1,
      metrics: { game_type: 'aero', completion_rate: rate / 100, moves_completed: done, total_moves: total, avg_response_time_ms: avgRT },
    });
  }, [onGameEnd]);

  const beginPlaying = useCallback(() => {
    gameStateRef.current = 'playing';
    setGameState('playing');
    moveStartRef.current = Date.now();
  }, []);

  const startCountdown = useCallback(() => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    gameStateRef.current = 'countdown';
    setGameState('countdown');
    let c = 3; setCountdown(c);
    cdIntervalRef.current = setInterval(() => {
      c--; setCountdown(c);
      if (c <= 0) { clearInterval(cdIntervalRef.current); beginPlaying(); }
    }, 1000);
  }, [beginPlaying]);

  const advanceMove = useCallback(() => {
    const si = selectedSetRef.current;
    const mi = currentMoveRef.current + 1;
    const set = SETS[si];
    if (mi < set.moves.length) {
      currentMoveRef.current = mi;
      currentRepsRef.current = 0;
      moveStartRef.current = Date.now();
      setCurrentMove(mi);
      setCurrentReps(0);
      detStateRef.current = {}; // reset detector states
    } else {
      endGame();
    }
  }, [endGame]);

  const handleSelectSet = useCallback((setIdx) => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    selectedSetRef.current = setIdx;
    setSelectedSet(setIdx);
    currentMoveRef.current = 0;
    currentRepsRef.current = 0;
    completedRef.current = 0;
    activeRef.current = false;
    detStateRef.current = {};
    responseTimesRef.current = [];
    setCurrentMove(0);
    setCurrentReps(0);
    setFinalRes(null);
    setIsActive(false);
    startCountdown();
  }, [startCountdown]);

  const handleReplay = useCallback(() => {
    if (selectedSetRef.current !== null) handleSelectSet(selectedSetRef.current);
  }, [handleSelectSet]);

  const handleBackToSelect = useCallback(() => {
    if (cdIntervalRef.current) clearInterval(cdIntervalRef.current);
    gameStateRef.current = 'select';
    setGameState('select');
    setSelectedSet(null);
    setFinalRes(null);
    selectedSetRef.current = null;
  }, []);

  // ── Derived ───────────────────────────────────────────────
  const set  = selectedSet !== null ? SETS[selectedSet] : null;
  const move = set?.moves[currentMove];
  const setProgress = set ? Math.round(((currentMove * (move?.reps ?? 0) + currentReps) / set.moves.reduce((a, m) => a + m.reps, 0)) * 100) : 0;

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Noto Sans Thai', 'Press Start 2P', sans-serif", background: '#FDF0E8', minHeight: '100%', padding: 8, color: '#3D2010' }}>
      {/* Video element always in DOM so videoRef is never null when camera effect runs */}
      <video ref={videoRef} style={{ display: 'none' }} width={W} height={H} playsInline />

      {/* SET SELECTION */}
      {gameState === 'select' && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🕺</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>AeroDance</h2>
            <p style={{ margin: 0, fontSize: 11, color: '#A07850' }}>เลือกเซตที่ต้องการฝึก</p>
            {status && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#e07a30' }}>{status}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {SETS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => modelReady && handleSelectSet(idx)}
                disabled={!modelReady}
                style={{
                  ...pxCard(s.border, s.drop, s.bg, '#fff'),
                  padding: '18px 14px',
                  cursor: modelReady ? 'pointer' : 'not-allowed',
                  opacity: modelReady ? 1 : 0.5,
                  textAlign: 'left', border: `4px solid ${s.border}`,
                  transition: 'transform 0.1s',
                }}
                onMouseEnter={e => { if (modelReady) e.currentTarget.style.transform = 'translate(-2px,-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: '#A07850', lineHeight: 1.8 }}>
                  {s.moves.map(m => `${m.emoji} ${m.name}`).join('\n').split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, display: 'inline-flex',
                  background: s.bg, border: `2px solid ${s.border}`,
                  padding: '4px 10px',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>
                    {modelReady ? '▶ เริ่มเลย!' : '⏳ โหลด AI...'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAMEPLAY */}
      {(gameState === 'playing' || gameState === 'countdown') && set && (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: set.color, fontWeight: 700, fontSize: 12 }}>{set.emoji} {set.name}</span>
            <span style={{ color: '#A07850', fontSize: 11 }}>
              ท่า {currentMove + 1}/{set.moves.length}
            </span>
          </div>
          <div style={{ height: 8, background: '#F4956A33', border: '2px solid #F4956A', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${setProgress}%`, background: set.color, transition: 'width 0.3s' }} />
          </div>

          {/* Camera + Skeleton side by side */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <canvas ref={canvasRef} width={W} height={H} style={{
                width: '100%', borderRadius: 0,
                border: `4px solid ${isActive ? '#00FF88' : set.border}`,
                boxShadow: `4px 4px 0 ${isActive ? '#059669' : set.drop}`,
                display: 'block', transition: 'border-color 0.2s',
              }} />
              {/* Countdown overlay */}
              {gameState === 'countdown' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                }}>
                  <div style={{ fontSize: 120, fontWeight: 900, color: '#F9C784', textShadow: '4px 4px 0 #D4900A', lineHeight: 1 }}>
                    {countdown || 'GO!'}
                  </div>
                </div>
              )}
            </div>

            {/* Skeleton illustration */}
            <div style={{ width: 160, flexShrink: 0 }}>
              <canvas ref={skelCanvasRef} width={160} height={220} style={{
                width: 160, height: 220,
                border: `4px solid ${set.border}`,
                boxShadow: `4px 4px 0 ${set.drop}`,
                borderRadius: 0, display: 'block',
              }} />
            </div>
          </div>

          {/* Move instruction */}
          {gameState === 'playing' && move && (
            <div style={{
              ...pxCard(isActive ? '#00FF88' : set.border, isActive ? '#059669' : set.drop, set.bg, '#fff'),
              border: `4px solid ${isActive ? '#00FF88' : set.border}`,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: moveFlash ? (isActive ? 'rgba(0,255,136,0.15)' : set.bg) : '#fff',
              transition: 'all 0.15s',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 28 }}>{move.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: '#3D2010' }}>{move.name}</div>
                <div style={{ fontSize: 11, color: '#A07850', marginTop: 2 }}>{move.desc}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                  {Array.from({ length: move.reps }).map((_, i) => (
                    <div key={i} style={{
                      width: 14, height: 14,
                      background: i < currentReps ? '#00FF88' : '#E8C4A8',
                      border: `2px solid ${i < currentReps ? '#059669' : '#C8A898'}`,
                      boxShadow: i < currentReps ? '2px 2px 0 #059669' : '2px 2px 0 #A89888',
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{
                  fontSize: 56, fontWeight: 900, lineHeight: 1,
                  color: isActive ? '#00CC66' : set.color,
                  textShadow: `3px 3px 0 ${isActive ? '#059669' : set.drop}`,
                }}>{currentReps}</div>
                <div style={{ fontSize: 14, color: '#A07850' }}>/{move.reps}</div>
                <div style={{
                  marginTop: 4, fontSize: 10, fontWeight: 700, padding: '2px 6px',
                  background: isActive ? '#00FF88' : '#F4956A33',
                  border: `2px solid ${isActive ? '#059669' : '#F4956A'}`,
                  color: isActive ? '#065F46' : '#C05E35',
                }}>
                  {isActive ? '✅ ดี!' : '⏳ รอ...'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {gameState === 'done' && finalRes && set && (
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...pxCard(set.border, set.drop, set.bg, '#fff'), border: `4px solid ${set.border}`, padding: '24px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>
              {finalRes.rate >= 80 ? '🏆' : finalRes.rate >= 60 ? '⭐' : '💪'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#3D2010' }}>
              {set.emoji} {set.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ ...pxCard('#F9C784', '#D4900A', '#FEF3C7', '#fff'), border: '4px solid #F9C784', padding: 14 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#D4900A' }}>{finalRes.rate}%</div>
                <div style={{ fontSize: 11, color: '#A07850' }}>ท่าสำเร็จ</div>
              </div>
              <div style={{ ...pxCard(set.border, set.drop, set.bg, '#fff'), border: `4px solid ${set.border}`, padding: 14 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: set.color }}>{finalRes.done}/{finalRes.total}</div>
                <div style={{ fontSize: 11, color: '#A07850' }}>ท่าครบ</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={handleReplay} style={{
                ...pxCard(set.border, set.drop, set.bg, '#fff'),
                border: `4px solid ${set.border}`, padding: '10px 20px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, color: set.color,
              }}>🔁 เล่นซ้ำ</button>
              <button onClick={handleBackToSelect} style={{
                ...pxCard('#F4956A', '#C05E35', '#FFF0E8', '#fff'),
                border: '4px solid #F4956A', padding: '10px 20px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#C05E35',
              }}>🎮 เลือกเซต</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AeroGame;
