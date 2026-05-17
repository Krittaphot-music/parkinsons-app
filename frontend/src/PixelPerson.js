import React from 'react';

export function hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function shade(hex, pct) {
  if (!hex || hex === 'transparent') return hex;
  const [r, g, b] = hexToRgb(hex);
  const f = 1 + pct / 100;
  return rgbToHex(r * f, g * f, b * f);
}

function brightness(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function colorDist([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export const SKIN_TONES = ['#FFE0C8', '#F5C5A3', '#E8A87C', '#D48255', '#B56030', '#8B4513', '#5A2D10'];
export const HAIR_COLORS = ['#0D0D0D', '#3D1C02', '#7B3F00', '#C07838', '#C8A000', '#CC6688', '#8B0000', '#9B9B9B', '#EEEEEE'];
export const OUTFIT_COLORS = ['#5B8DEF', '#EF5B5B', '#5BCE8A', '#F4956A', '#A78BFA', '#F9C784', '#EC4899', '#64748B', '#38BDF8'];
export const PANTS_COLORS = ['#54B96D', '#3B82F6', '#7C5C45', '#111827', '#8B5CF6', '#F59E0B', '#94A3B8', '#F472B6'];
export const HAIR_STYLES = ['short', 'medium', 'long', 'twin'];
export const HAIR_STYLE_LABELS = { short: 'สั้น', medium: 'กลาง', long: 'ยาว', twin: 'แกละคู่' };
export const HATS = ['none', 'cap', 'beanie', 'nurse', 'crown'];
export const HAT_LABELS = { none: 'ไม่ใส่', cap: 'หมวกแก๊ป', beanie: 'ไหมพรม', nurse: 'พยาบาล', crown: 'มงกุฎ' };
export const POSES = ['neutral', 'wave', 'pocket', 'hero'];
export const POSE_LABELS = { neutral: 'ยืนตรง', wave: 'ยกมือ', pocket: 'เท้าเอว', hero: 'มั่นใจ' };

export const DEFAULT_PROFILE = {
  name: '',
  age: '',
  skin: '#F5C5A3',
  hair: '#3D1C02',
  outfit: '#5B8DEF',
  pants: '#54B96D',
  hairStyle: 'medium',
  hat: 'cap',
  pose: 'neutral',
};

function PixelPerson({
  skin = '#F5C5A3',
  hair = '#3D1C02',
  outfit = '#5B8DEF',
  pants = '#54B96D',
  hairStyle = 'medium',
  hat = 'none',
  pose = 'neutral',
  scale = 4,
}) {
  const s = scale;
  const T = 'transparent';
  const OUT = '#4A2512';
  const SK = skin;
  const SKD = shade(skin, -22);
  const SKL = shade(skin, 14);
  const H = hair;
  const HL = brightness(hair) > 120 ? shade(hair, -16) : shade(hair, 26);
  const HD = shade(hair, -24);
  const SHIRT = outfit;
  const SHIRTL = shade(outfit, 24);
  const SHIRTD = shade(outfit, -24);
  const PANTS = pants;
  const PANTSD = shade(pants, -28);
  const SHOE = '#9A663C';
  const SHOED = '#5A3219';
  const WHITE = '#FFFFFF';
  const EYE = '#2A150A';
  const BLUSH = '#E47770';
  const RED = '#EF3E2F';
  const GOLD = '#F8C84E';
  const GRAY = '#BFC5CE';

  const w = 24;
  const h = 34;
  const cells = Array.from({ length: h }, () => Array(w).fill(T));
  const put = (x, y, color) => {
    if (x >= 0 && x < w && y >= 0 && y < h) cells[y][x] = color;
  };
  const rect = (x, y, ww, hh, color) => {
    for (let yy = y; yy < y + hh; yy += 1) for (let xx = x; xx < x + ww; xx += 1) put(xx, yy, color);
  };

  // Soft ground shadow.
  rect(4, 32, 16, 1, '#CFC8B8');
  rect(6, 31, 12, 1, '#D9D2C3');

  // Hair behind the face.
  if (hairStyle === 'long') {
    rect(5, 6, 14, 13, OUT);
    rect(6, 6, 12, 13, H);
    rect(7, 7, 4, 2, HL);
    rect(17, 9, 1, 8, HD);
  } else if (hairStyle === 'twin') {
    rect(3, 6, 4, 5, OUT);
    rect(4, 6, 3, 5, H);
    rect(17, 6, 4, 5, OUT);
    rect(17, 6, 3, 5, H);
    rect(2, 8, 3, 4, OUT);
    rect(19, 8, 3, 4, OUT);
    rect(3, 8, 2, 3, H);
    rect(19, 8, 2, 3, H);
  }

  // Head outline and face.
  rect(6, 5, 12, 1, OUT);
  rect(5, 6, 14, 1, OUT);
  rect(4, 7, 16, 8, OUT);
  rect(5, 15, 14, 2, OUT);
  rect(6, 6, 12, 9, SK);
  rect(7, 15, 10, 1, SK);
  rect(7, 6, 3, 1, SKL);
  rect(16, 12, 1, 2, SKD);

  // Front hair silhouettes.
  if (hairStyle === 'short') {
    rect(6, 4, 12, 2, OUT);
    rect(7, 4, 10, 2, H);
    rect(6, 6, 4, 2, H);
    rect(14, 6, 4, 2, H);
    rect(8, 4, 2, 1, HL);
  } else if (hairStyle === 'medium') {
    rect(5, 4, 14, 3, OUT);
    rect(6, 4, 12, 3, H);
    rect(5, 7, 2, 5, OUT);
    rect(17, 7, 2, 5, OUT);
    rect(6, 7, 1, 4, H);
    rect(17, 7, 1, 4, H);
    rect(8, 4, 3, 1, HL);
  } else if (hairStyle === 'long') {
    rect(5, 4, 14, 3, OUT);
    rect(6, 4, 12, 3, H);
    rect(5, 7, 3, 9, H);
    rect(16, 7, 3, 9, H);
    rect(8, 4, 3, 1, HL);
  } else if (hairStyle === 'twin') {
    rect(6, 4, 12, 3, OUT);
    rect(7, 4, 10, 3, H);
    rect(8, 4, 3, 1, HL);
  }

  // Face details: small eyes, blush, and a slight smile.
  rect(8, 10, 1, 2, EYE);
  rect(15, 10, 1, 2, EYE);
  put(8, 10, WHITE);
  put(15, 10, WHITE);
  put(7, 13, BLUSH);
  put(16, 13, BLUSH);
  rect(10, 14, 3, 1, EYE);
  put(13, 13, EYE);

  // Neck.
  rect(10, 16, 4, 2, OUT);
  rect(10, 16, 4, 1, SK);

  // Body.
  rect(6, 18, 12, 8, OUT);
  rect(7, 18, 10, 7, SHIRT);
  rect(8, 18, 3, 6, SHIRTL);
  rect(14, 19, 3, 6, SHIRTD);
  rect(10, 18, 4, 1, '#2F6A96');
  rect(8, 22, 8, 1, WHITE);
  rect(8, 21, 1, 1, WHITE);
  rect(11, 21, 1, 1, WHITE);
  rect(14, 21, 1, 1, WHITE);
  rect(6, 25, 12, 1, OUT);

  const arms = {
    neutral: {
      left: [[4, 19], [4, 20], [4, 21], [5, 21], [5, 22], [5, 23]],
      right: [[19, 19], [19, 20], [19, 21], [18, 21], [18, 22], [18, 23]],
      hands: [[5, 24], [18, 24]],
    },
    wave: {
      left: [[4, 19], [3, 18], [3, 17], [4, 16]],
      right: [[19, 19], [19, 20], [18, 21], [18, 22]],
      hands: [[4, 15], [18, 23]],
    },
    pocket: {
      left: [[4, 20], [5, 21], [6, 22]],
      right: [[19, 20], [18, 21], [17, 22]],
      hands: [[6, 23], [17, 23]],
    },
    hero: {
      left: [[3, 19], [4, 19], [5, 20], [5, 21]],
      right: [[20, 19], [19, 19], [18, 20], [18, 21]],
      hands: [[5, 22], [18, 22]],
    },
  }[pose] || {};

  [...(arms.left || []), ...(arms.right || [])].forEach(([x, y]) => {
    rect(x, y, 2, 2, OUT);
    rect(x + 1, y, 1, 2, SHIRT);
  });
  (arms.hands || []).forEach(([x, y]) => {
    rect(x, y, 2, 2, OUT);
    put(x, y, SK);
    put(x + 1, y, SKL);
  });

  // Pants and pose-specific legs.
  rect(7, 26, 10, 1, OUT);
  rect(7, 27, 4, 5, OUT);
  rect(13, 27, 4, 5, OUT);
  rect(8, 27, 3, 4, PANTS);
  rect(13, 27, 3, 4, PANTS);
  rect(10, 27, 1, 2, PANTSD);
  rect(15, 27, 1, 2, PANTSD);

  if (pose === 'hero') {
    rect(6, 29, 4, 3, OUT);
    rect(14, 29, 4, 3, OUT);
    rect(7, 29, 3, 2, PANTS);
    rect(14, 29, 3, 2, PANTS);
  } else if (pose === 'pocket') {
    rect(8, 30, 3, 2, OUT);
    rect(13, 30, 3, 2, OUT);
  }

  // Shoes.
  rect(6, 31, 6, 2, OUT);
  rect(13, 31, 6, 2, OUT);
  rect(7, 31, 5, 1, SHOE);
  rect(13, 31, 5, 1, SHOE);
  rect(7, 32, 5, 1, SHOED);
  rect(13, 32, 5, 1, SHOED);

  // Hats sit last so they can cover hair cleanly.
  if (hat === 'cap') {
    rect(5, 2, 14, 2, OUT);
    rect(6, 2, 12, 2, RED);
    rect(7, 1, 10, 1, OUT);
    rect(8, 1, 8, 1, RED);
    rect(4, 4, 8, 1, OUT);
    rect(4, 3, 4, 1, RED);
    rect(9, 2, 4, 2, WHITE);
    rect(6, 2, 2, 1, shade(RED, 28));
  } else if (hat === 'beanie') {
    rect(6, 1, 12, 4, OUT);
    rect(7, 1, 10, 3, '#8B5CF6');
    rect(8, 0, 8, 1, OUT);
    rect(9, 0, 6, 1, '#A78BFA');
    rect(7, 4, 10, 1, '#5B21B6');
  } else if (hat === 'nurse') {
    rect(5, 2, 14, 4, OUT);
    rect(6, 2, 12, 3, WHITE);
    rect(8, 5, 8, 1, GRAY);
    rect(11, 2, 2, 3, RED);
    rect(10, 3, 4, 1, RED);
  } else if (hat === 'crown') {
    rect(6, 2, 12, 1, OUT);
    rect(7, 2, 10, 2, GOLD);
    rect(7, 0, 2, 3, OUT);
    rect(11, 0, 2, 3, OUT);
    rect(15, 0, 2, 3, OUT);
    put(8, 1, GOLD);
    put(12, 1, GOLD);
    put(16, 1, GOLD);
    rect(8, 3, 8, 1, shade(GOLD, -18));
  }

  return (
    <svg
      width={w * s}
      height={h * s}
      viewBox={`0 0 ${w * s} ${h * s}`}
      style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {cells.map((row, y) => row.map((color, x) => (
        color !== T
          ? <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={color} shapeRendering="crispEdges" />
          : null
      )))}
    </svg>
  );
}

export default PixelPerson;
