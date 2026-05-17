import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// ท่าทั้งหมด
const ALL_POSES = {
  กางแขนออก: {
    name: 'กางแขนออก',
    therapy: 'ฝึก Amplitude แขนสองข้าง',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*1.2, cy - s*0.5); ctx.lineTo(cx + s*1.2, cy - s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.5, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.5, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
      return lw.x > ls.x + 0.08 && rw.x < rs.x - 0.08 &&
             Math.abs(lw.y - ls.y) < 0.3 && Math.abs(rw.y - rs.y) < 0.3;
    }
  },
  ยกแขนทั้งสอง: {
    name: 'ยกแขนทั้งสองขึ้น',
    therapy: 'ฝึก Overhead Reach',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.7); ctx.lineTo(cx - s*0.8, cy - s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.7); ctx.lineTo(cx + s*0.8, cy - s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.5, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.5, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
      return lw.y < ls.y - 0.1 && rw.y < rs.y - 0.1;
    }
  },
  แยกขา: {
    name: 'แยกขา',
    therapy: 'ฝึก Base of Support',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.9, cy - s*0.5); ctx.lineTo(cx + s*0.9, cy - s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.8, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.8, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26];
      return Math.abs(lh.x - rh.x) > 0.1 || Math.abs(lk.x - rk.x) > 0.15;
    }
  },
  ยืนตรง: {
    name: 'ยืนตรง (พัก)',
    therapy: 'ฝึก Postural Alignment',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.6); ctx.lineTo(cx - s*0.4, cy - s*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.6); ctx.lineTo(cx + s*0.4, cy - s*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.3, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.3, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lw = lm[15], rw = lm[16], ls = lm[11], rs = lm[12];
      const lElbow = lm[13], rElbow = lm[14];
      return lw.y > ls.y && rw.y > rs.y && lElbow.y > ls.y && rElbow.y > rs.y;
    }
  },
  ยกแขนซ้าย: {
    name: 'ยกแขนซ้ายขึ้น',
    therapy: 'ฝึก Range of Motion แขนซ้าย',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.7); ctx.lineTo(cx - s*0.8, cy - s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.5); ctx.lineTo(cx + s*0.9, cy - s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.5, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.5, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lw = lm[15], ls = lm[11], rw = lm[16], rs = lm[12];
      return lw.y < ls.y - 0.1 && Math.abs(rw.y - rs.y) < 0.3;
    }
  },
  ยกแขนขวา: {
    name: 'ยกแขนขวาขึ้น',
    therapy: 'ฝึก Range of Motion แขนขวา',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.7); ctx.lineTo(cx + s*0.8, cy - s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.5); ctx.lineTo(cx - s*0.9, cy - s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.5, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.5, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const rw = lm[16], rs = lm[12], lw = lm[15], ls = lm[11];
      return rw.y < rs.y - 0.1 && Math.abs(lw.y - ls.y) < 0.3;
    }
  },
  เอียงซ้าย: {
    name: 'เอียงซ้าย',
    therapy: 'ฝึก Lateral Weight Shift',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx - s*0.2, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - s*0.2, cy - s*0.9); ctx.lineTo(cx + s*0.2, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.8, cy - s*0.3); ctx.lineTo(cx + s*0.8, cy - s*0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s*0.2, cy + s*0.5); ctx.lineTo(cx - s*0.3, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s*0.2, cy + s*0.5); ctx.lineTo(cx + s*0.7, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
      return (ls.y - rs.y) > 0.05 && (lh.y - rh.y) > 0.03;
    }
  },
  เอียงขวา: {
    name: 'เอียงขวา',
    therapy: 'ฝึก Lateral Weight Shift',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx + s*0.2, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + s*0.2, cy - s*0.9); ctx.lineTo(cx - s*0.2, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.8, cy - s*0.7); ctx.lineTo(cx + s*0.8, cy - s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.2, cy + s*0.5); ctx.lineTo(cx - s*0.7, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.2, cy + s*0.5); ctx.lineTo(cx + s*0.3, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
      return (rs.y - ls.y) > 0.05 && (rh.y - lh.y) > 0.03;
    }
  },
  มือสะเอว: {
    name: 'มือสะเอว',
    therapy: 'ฝึก Trunk Stability',
    draw: (ctx, cx, cy, s) => {
      ctx.beginPath(); ctx.arc(cx, cy - s*1.2, s*0.3, 0, 2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.9); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.5); ctx.lineTo(cx - s*0.6, cy - s*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.6, cy - s*0.2); ctx.lineTo(cx - s*0.5, cy + s*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s*0.5); ctx.lineTo(cx + s*0.6, cy - s*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s*0.6, cy - s*0.2); ctx.lineTo(cx + s*0.5, cy + s*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx - s*0.5, cy + s*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s*0.5); ctx.lineTo(cx + s*0.5, cy + s*1.5); ctx.stroke();
    },
    check: (lm) => {
      const lw = lm[15], rw = lm[16], lh = lm[23], rh = lm[24];
      return Math.abs(lw.x - lh.x) < 0.15 && Math.abs(rw.x - rh.x) < 0.15 &&
             Math.abs(lw.y - lh.y) < 0.2 && Math.abs(rw.y - rh.y) < 0.2;
    }
  },
};

const LEVELS = {
  1: {
    name: 'Amplitude',
    emoji: '🌱',
    color: 'bg-green-600',
    description: 'ฝึกขยับให้ใหญ่ขึ้น ท่าพื้นฐาน',
    poses: ['กางแขนออก', 'ยกแขนทั้งสอง', 'แยกขา', 'ยืนตรง'],
    targetMoves: 8,
    timeLimit: 90,
    holdNeeded: 180,
  },
  2: {
    name: 'Symmetry',
    emoji: '⚡',
    color: 'bg-yellow-600',
    description: 'ฝึกซ้าย-ขวาให้สมดุล',
    poses: ['ยกแขนซ้าย', 'ยกแขนขวา', 'เอียงซ้าย', 'เอียงขวา', 'มือสะเอว'],
    targetMoves: 10,
    timeLimit: 75,
    holdNeeded: 180,
  },
  3: {
    name: 'Coordination',
    emoji: '💀',
    color: 'bg-red-600',
    description: 'ฝึกตอบสนองเร็ว ทุกท่า',
    poses: ['กางแขนออก', 'ยกแขนทั้งสอง', 'แยกขา', 'ยืนตรง', 'ยกแขนซ้าย', 'ยกแขนขวา', 'เอียงซ้าย', 'เอียงขวา', 'มือสะเอว'],
    targetMoves: 12,
    timeLimit: 60,
    holdNeeded: 180,
  },
};

function drawPose(ctx, pose, cx, cy, s, color = '#ffffff') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  pose.draw(ctx, cx, cy, s);
}

function ShadowGame({ startLevel = 1 }) {
  const videoRef = useRef(null);
  const mainCanvasRef = useRef(null);
  const poseCanvasRef = useRef(null);
  const upcomingCanvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const gameStateRef = useRef('idle');
  const poseQueueRef = useRef([]);
  const currentPoseRef = useRef(null);
  const holdTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const movesRef = useRef(0);
  const currentLevelRef = useRef(1);
  const holdNeededRef = useRef(30);
  const frameCountRef = useRef(0);
  const lastResultsRef = useRef(null);

  const [status, setStatus] = useState('กำลังโหลด AI...');
  const [gameState, setGameState] = useState('idle');
  const [isMatching, setIsMatching] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentPoseName, setCurrentPoseName] = useState('');
  const [musicName, setMusicName] = useState('');
  const [countdownNum, setCountdownNum] = useState(3);
  const [flash, setFlash] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const audioRef = useRef(null);

  const W = 600, H = 400;

  const generateQueue = (level) => {
    const cfg = LEVELS[level];
    const poseKeys = cfg.poses;
    const q = [];
    let lastKey = '';
    for (let i = 0; i < 15; i++) {
      let key;
      do {
        key = poseKeys[Math.floor(Math.random() * poseKeys.length)];
      } while (key === lastKey);
      lastKey = key;
      q.push(ALL_POSES[key]);
    }
    return q;
  };

  const drawUpcoming = (queue) => {
    const canvas = upcomingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const colors = ['#a78bfa', '#818cf8', '#6366f1'];
    queue.slice(0, 3).forEach((pose, i) => {
      const cx = 60 + i * 100;
      const cy = 60;
      ctx.fillStyle = colors[i] + '33';
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 45, cy - 50, 90, 100, 8);
      ctx.fill();
      ctx.stroke();
      drawPose(ctx, pose, cx, cy - 5, 22, colors[i]);
      ctx.fillStyle = colors[i];
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, cx, cy + 48);
    });
  };

  const drawTargetPose = (pose) => {
    setTimeout(() => {
      const canvas = poseCanvasRef.current;
      if (!canvas || !pose) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(167, 139, 250, 0.1)';
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TARGET', canvas.width / 2, 22);
      drawPose(ctx, pose, canvas.width / 2, canvas.height / 2 + 10, 35, '#ffffff');
      ctx.fillStyle = '#c4b5fd';
      ctx.font = '11px sans-serif';
      ctx.fillText(pose.name, canvas.width / 2, canvas.height - 20);
      ctx.fillStyle = '#818cf8';
      ctx.font = '9px sans-serif';
      ctx.fillText(pose.therapy || '', canvas.width / 2, canvas.height - 8);
    }, 100);
  };

  useEffect(() => {
    let stream;
    let isMounted = true;

    const setup = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1
      });

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 20 }
      });
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted || !videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        setTimeout(() => {
          if (!isMounted) return;
          setStatus('พร้อมแล้ว! ยืนให้กล้องเห็นทั้งตัว แล้วกดเริ่ม');
          startGame(startLevel);
          loop();
        }, 500);
      };
    };

    const loop = () => {
      if (!poseLandmarkerRef.current || !videoRef.current) return;
      const canvas = mainCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      frameCountRef.current += 1;
      if (frameCountRef.current % 2 === 0) {
        lastResultsRef.current = poseLandmarkerRef.current.detectForVideo(
          videoRef.current, performance.now()
        );
      }
      const results = lastResultsRef.current;
      if (!results) { requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, W, H);

      if (results.landmarks && results.landmarks.length > 0) {
        const lm = results.landmarks[0];

        PoseLandmarker.POSE_CONNECTIONS.forEach(({ start, end }) => {
          const s = lm[start], e = lm[end];
          ctx.beginPath();
          ctx.moveTo((1 - s.x) * W, s.y * H);
          ctx.lineTo((1 - e.x) * W, e.y * H);
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
          ctx.lineWidth = 3;
          ctx.stroke();
        });

        lm.forEach((point, i) => {
          if (i > 10) {
            ctx.beginPath();
            ctx.arc((1 - point.x) * W, point.y * H, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#facc15';
            ctx.fill();
          }
        });

        if (gameStateRef.current === 'playing' && currentPoseRef.current) {
          const matched = currentPoseRef.current.check(lm);
          setIsMatching(matched);

          if (matched) {
            holdTimeRef.current += 1;
            setHoldProgress(Math.min(holdTimeRef.current / holdNeededRef.current * 100, 100));
            if (holdTimeRef.current >= holdNeededRef.current) {
              scoreRef.current += 10;
              movesRef.current += 1;
              setFlash(true);
              setTimeout(() => setFlash(false), 300);

              try {
                const ctx2 = new AudioContext();
                const osc = ctx2.createOscillator();
                const gain = ctx2.createGain();
                osc.connect(gain); gain.connect(ctx2.destination);
                osc.frequency.setValueAtTime(880, ctx2.currentTime);
                osc.frequency.exponentialRampToValueAtTime(440, ctx2.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, ctx2.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.2);
                osc.start(); osc.stop(ctx2.currentTime + 0.2);
              } catch(e) {}

              const queue = poseQueueRef.current;
              queue.shift();
              if (queue.length < 3) {
                queue.push(...generateQueue(currentLevelRef.current).slice(0, 5));
              }
              currentPoseRef.current = queue[0];
              setCurrentPoseName(queue[0].name);
              holdTimeRef.current = 0;
              setHoldProgress(0);
              drawUpcoming(queue.slice(1));
              drawTargetPose(queue[0]);
            }
          } else {
            holdTimeRef.current = Math.max(0, holdTimeRef.current - 0.5);
            setHoldProgress(Math.max(0, holdTimeRef.current / holdNeededRef.current * 100));
          }
        }
      }

      requestAnimationFrame(loop);
    };

    setup();
    return () => {
      isMounted = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startGame = (level = currentLevel) => {
    const cfg = LEVELS[level];
    setCurrentLevel(level);
    currentLevelRef.current = level;
    holdNeededRef.current = cfg.holdNeeded;

    const queue = generateQueue(level);
    poseQueueRef.current = queue;
    currentPoseRef.current = queue[0];
    holdTimeRef.current = 0;
    scoreRef.current = 0;
    movesRef.current = 0;
    setScore(null);
    setHoldProgress(0);
    setTimeLeft(cfg.timeLimit);
    setCurrentPoseName(queue[0].name);
    setGameState('countdown');
    gameStateRef.current = 'countdown';
    setCountdownNum(3);
    setShowLevelSelect(false);

    const playBeep = (freq) => {
      try {
        const actx = new AudioContext();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain); gain.connect(actx.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.3);
        osc.start(); osc.stop(actx.currentTime + 0.3);
      } catch(e) {}
    };

    playBeep(440);
    let c = 3;
    const cdTimer = setInterval(() => {
      c -= 1;
      setCountdownNum(c);
      if (c > 0) playBeep(440);
      else playBeep(880);
      if (c <= 0) {
        clearInterval(cdTimer);
        setGameState('playing');
        gameStateRef.current = 'playing';
        setStatus('ทำท่าตาม TARGET!');
        if (audioRef.current) {
          audioRef.current.src = '/music/bgm.mp3';
          audioRef.current.loop = true;
          audioRef.current.play().catch(() => {});
        }
      }
    }, 1000);

    setTimeout(() => {
      drawTargetPose(queue[0]);
      drawUpcoming(queue.slice(1));
    }, 3200);

    let t = cfg.timeLimit;
    const timer = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (movesRef.current >= cfg.targetMoves) {
        clearInterval(timer);
        gameStateRef.current = 'done';
        setGameState('done');
        setScore({ score: scoreRef.current, moves: movesRef.current, win: true });
        setStatus('🎉 ชนะแล้ว!');
        if (level < 3) setUnlockedLevel(prev => Math.max(prev, level + 1));
        if (audioRef.current) audioRef.current.pause();
      } else if (t <= 0) {
        clearInterval(timer);
        gameStateRef.current = 'done';
        setGameState('done');
        setScore({ score: scoreRef.current, moves: movesRef.current, win: false });
        setStatus('เกมจบแล้ว!');
        if (audioRef.current) audioRef.current.pause();
      }
    }, 1000);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">🥷 Shadow Fighter</h2>

      
      {gameState !== 'playing' && !showLevelSelect && (
        <div className="bg-gray-800 rounded-xl p-3 mb-3 text-left">
          <p className="text-sm text-gray-400 mb-2">🎵 เพลงประกอบ (ไม่บังคับ)</p>
          <input type="file" accept="audio/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (audioRef.current) {
                audioRef.current.src = URL.createObjectURL(file);
                audioRef.current.loop = true;
              }
              setMusicName(file.name);
            }}
            className="text-sm text-gray-300 w-full"
          />
          {musicName && <p className="text-xs text-green-400 mt-1">✅ {musicName}</p>}
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />

      {flash && (
        <div className="fixed inset-0 bg-green-400 bg-opacity-20 z-40 pointer-events-none animate-ping" />
      )}

      <div className="flex gap-2 mb-2">
        <div className="relative flex-1" style={{ height: '300px' }}>
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-full rounded-xl object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={mainCanvasRef} className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }} />

          {gameState === 'playing' && (
            <>
              <div className="absolute top-2 left-2 right-2 flex justify-between">
                <span className="bg-black bg-opacity-70 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                  ⏱ {timeLeft}s
                </span>
                <span className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                  ✅ {movesRef.current} / {LEVELS[currentLevel].targetMoves} ท่า
                </span>
                <span className="bg-black bg-opacity-70 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                  {LEVELS[currentLevel].emoji} Lv.{currentLevel}
                </span>
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${isMatching ? 'bg-green-400' : 'bg-gray-600'}`}
                    style={{ width: `${holdProgress > 0 ? holdProgress : 100}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-center font-semibold ${isMatching ? 'text-green-400' : 'text-red-400'}`}>
                  {isMatching ? '✅ ถูกต้อง! ค้างไว้...' : '❌ ยังไม่ตรง'}
                </p>
              </div>
            </>
          )}
        </div>

        {gameState === 'playing' && (
          <div className="flex flex-col gap-2" style={{ width: '120px' }}>
            <div className="bg-gray-800 rounded-xl p-1">
              <canvas ref={poseCanvasRef} width={110} height={150} className="w-full" />
            </div>
            <div className="bg-gray-800 rounded-xl p-2">
              <p className="text-xs text-gray-400 mb-1 text-center">UPCOMING</p>
              <canvas ref={upcomingCanvasRef} width={300} height={120} className="w-full" />
            </div>
          </div>
        )}
      </div>

      <p className="text-yellow-400 font-semibold mt-1 mb-2">{status}</p>

      {score !== null && (
        <div className={`rounded-xl p-6 mb-3 text-center ${score.win ? 'bg-gradient-to-b from-yellow-900 to-gray-800 border-2 border-yellow-400' : 'bg-gray-800'}`}>
          {score.win ? (
            <>
              <p className="text-7xl mb-3 animate-bounce">🏆</p>
              <p className="text-4xl font-bold text-yellow-400 mb-1">ผ่านเลเวล {currentLevel}!</p>
              {currentLevel < 3 && <p className="text-green-400 mt-1">🔓 ปลดล็อคเลเวล {currentLevel + 1} แล้ว!</p>}
              <p className="text-lg text-green-400 mb-2">ทำได้ครบ {LEVELS[currentLevel].targetMoves} ท่า!</p>
              <p className="text-3xl font-bold text-white">{score.score} pts</p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="text-3xl animate-spin">⭐</span>
                <span className="text-3xl animate-bounce">⭐</span>
                <span className="text-3xl animate-spin">⭐</span>
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => { setShowLevelSelect(true); setScore(null); setGameState('idle'); }}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl text-white font-semibold">
                  เลือกเลเวล
                </button>
                {currentLevel < 3 && (
                  <button onClick={() => startGame(currentLevel + 1)}
                    className="bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded-xl text-white font-semibold">
                    เลเวล {currentLevel + 1} →
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl mb-2">💪</p>
              <p className="text-5xl font-bold text-green-400">{score.score}</p>
              <p className="text-lg mt-1 text-gray-300">คะแนน</p>
              <p className="text-gray-400 mt-1">ทำได้ {score.moves} / {LEVELS[currentLevel].targetMoves} ท่า</p>
              <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
                <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${(score.moves / LEVELS[currentLevel].targetMoves) * 100}%` }} />
              </div>
              {score.moves >= LEVELS[currentLevel].targetMoves * 0.8 && <p className="text-blue-400 mt-2">👍 เกือบแล้ว ลองอีกที!</p>}
              {score.moves < LEVELS[currentLevel].targetMoves * 0.8 && <p className="text-red-400 mt-2">💪 ฝึกต่อไปนะ!</p>}
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => { setShowLevelSelect(true); setScore(null); setGameState('idle'); }}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl text-white font-semibold">
                  เลือกเลเวล
                </button>
                <button onClick={() => startGame(currentLevel)}
                  className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-white font-semibold">
                  🔄 ลองใหม่
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {gameState === 'countdown' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="text-center">
            <p className="text-9xl font-bold text-yellow-400 animate-bounce">{countdownNum}</p>
            <p className="text-white text-xl mt-4">เตรียมตัวให้พร้อม!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShadowGame;