import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const W = 400, H = 600;

function JumpGame({ startLevel = 1, onGameEnd }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const gameStateRef = useRef('idle');
  const playerRef = useRef({ x: W/2, y: H-100, vy: 0, onGround: false });
  const platformsRef = useRef([]);
  const monstersRef = useRef([]);
  const scoreRef = useRef(0);
  const prevKneeRef = useRef(null);
  const baseShoulderRef = useRef(null);
  const jumpCooldownRef = useRef(0);
  const cdTimerRef = useRef(null);
  const liftCountRef = useRef(0);
  const liftHeightsRef = useRef([]);
  const liftTimestampsRef = useRef([]);
  const playerXHistoryRef = useRef([]);
  const lastLandmarksRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const calibratedRef = useRef(false);
  const currentLevelRef = useRef(1);
  const frameCountRef = useRef(0);

  const [gameState, setGameState] = useState('idle');
  const [status, setStatus] = useState('กำลังโหลด AI...');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(3);
  const [showLevelSelect, setShowLevelSelect] = useState(false);


  const LEVELS = {
    1: {
      name: 'มือใหม่',
      emoji: '🌱',
      color: 'bg-green-600',
      targetScore: 100,
      platWidth: [100, 140],
      platGap: 50,
      monsterChance: 0,
      description: 'platform ใหญ่ ไม่มีมอนสเตอร์',
    },
    2: {
      name: 'นักผจญภัย',
      emoji: '⚡',
      color: 'bg-yellow-600',
      targetScore: 100,
      platWidth: [70, 100],
      platGap: 60,
      monsterChance: 0.3,
      description: 'platform เล็กลง มีมอนสเตอร์ยืนนิ่ง',
    },
    3: {
      name: 'ผู้เชี่ยวชาญ',
      emoji: '💀',
      color: 'bg-red-600',
      targetScore: 100,
      platWidth: [50, 80],
      platGap: 70,
      monsterChance: 0.5,
      description: 'platform เล็กมาก มอนสเตอร์เดินได้',
    },
  };

  const GRAVITY = 0.35;
  const JUMP_FORCE = -13;
  const PLAYER_SPEED = 5;
  const PLAYER_W = 30, PLAYER_H = 40;
  const PLAT_H = 12;

  const generatePlatforms = (startY, count = 8, level = 1) => {
    const cfg = LEVELS[level];
    const platforms = [];
    for (let i = 0; i < count; i++) {
      const w = cfg.platWidth[0] + Math.random() * (cfg.platWidth[1] - cfg.platWidth[0]);
      platforms.push({
        x: 40 + Math.random() * (W - w - 80),
        y: startY - i * cfg.platGap,
        w,
      });
    }
    return platforms;
  };

  const spawnMonster = (plat) => ({
    x: plat.x + plat.w / 2,
    w: 28, h: 28,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 1 + Math.random(),
    platform: plat,
  });

  useEffect(() => {
    let stream;
    let isMounted = true;

    const setup = async () => {
      await new Promise(r => setTimeout(r, 300));
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

      // รอให้ videoRef mount ก่อน (กัน null หลัง async/await)
      let waited = 0;
      while (!videoRef.current && waited < 3000 && isMounted) {
        await new Promise(r => setTimeout(r, 100));
        waited += 100;
      }
      if (!isMounted || !videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        if (!isMounted) return;
        setStatus('พร้อมแล้ว! ยืนให้กล้องเห็นทั้งตัว');
        startGame(startLevel);
        loop();
      };
    };

    const loop = () => {
      if (!poseLandmarkerRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      if (videoRef.current.readyState < 2) {
        requestAnimationFrame(loop);
        return;
      }

      frameCountRef.current += 1;
      if (frameCountRef.current % 2 === 0) {
        const r = poseLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        if (r.landmarks && r.landmarks.length > 0) {
          lastLandmarksRef.current = r.landmarks[0];
        }
      }

      let leanX = 0;
      let jumped = false;

      if (lastLandmarksRef.current) {
        const lm = lastLandmarksRef.current;
        const ls = lm[11], rs = lm[12];
        const lk = lm[25], rk = lm[26];
        const lh = lm[23], rh = lm[24];

        const shoulderMid = (ls.x + rs.x) / 2;
        if (baseShoulderRef.current === null && gameStateRef.current === 'playing') {
          baseShoulderRef.current = shoulderMid;
        }

        if (baseShoulderRef.current !== null) {
          const diff = shoulderMid - baseShoulderRef.current;
          leanX = Math.abs(diff) > 0.03 ? diff * -4 : 0;
        }

        const kneeAvg = (lk.y + rk.y) / 2;
        const hipAvg = (lh.y + rh.y) / 2;
        const kneeRaise = hipAvg - kneeAvg;

        if (prevKneeRef.current !== null) {
          const kneeDelta = prevKneeRef.current - kneeAvg;
          if (kneeDelta > 0.04 && kneeRaise > -0.05 && jumpCooldownRef.current <= 0) {
            jumped = true;
            jumpCooldownRef.current = 30;
            liftCountRef.current += 1;
            liftHeightsRef.current.push(kneeDelta);
            liftTimestampsRef.current.push(Date.now());
          }
        }
        if (jumpCooldownRef.current > 0) jumpCooldownRef.current -= 1;
        prevKneeRef.current = kneeAvg;
      }

      if (gameStateRef.current === 'countdown' || gameStateRef.current === 'idle' || gameStateRef.current === 'done') {
        if (skeletonCanvasRef.current) {
          skeletonCanvasRef.current.getContext('2d').clearRect(0, 0, skeletonCanvasRef.current.width, skeletonCanvasRef.current.height);
        }
        requestAnimationFrame(loop);
        return;
      }

      if (gameStateRef.current === 'playing') {
        const player = playerRef.current;
        if (frameCountRef.current % 10 === 0) playerXHistoryRef.current.push(player.x);

        player.x += leanX * PLAYER_SPEED;
        player.x = Math.max(PLAYER_W/2, Math.min(W - PLAYER_W/2, player.x));

        if (jumped && player.onGround) {
          player.vy = JUMP_FORCE;
          player.onGround = false;
          // เสียงกระโดด
          try {
            const actx = new AudioContext();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, actx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, actx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.2);
            osc.start();
            osc.stop(actx.currentTime + 0.2);
          } catch(e) {}
        }

        player.vy = Math.min(player.vy + GRAVITY, 20);
        player.y += player.vy;
        player.onGround = false;

        platformsRef.current.forEach(plat => {
          if (player.vy > 0 &&
            player.x + PLAYER_W/2 > plat.x &&
            player.x - PLAYER_W/2 < plat.x + plat.w &&
            player.y + PLAYER_H/2 >= plat.y &&
            player.y + PLAYER_H/2 <= plat.y + PLAT_H + player.vy + 2) {
            player.y = plat.y - PLAYER_H/2;
            player.vy = 0;
            player.onGround = true;
          }
        });

        if (player.y < H * 0.35) {
          const shift = H * 0.35 - player.y;
          player.y = H * 0.35;
          scoreRef.current += Math.floor(shift);
          setScore(Math.floor(scoreRef.current / 10));

          platformsRef.current.forEach(p => { p.y += shift; });

          const topY = Math.min(...platformsRef.current.map(p => p.y));
          if (topY > -50) {
            const lv = currentLevelRef.current;
            const cfg = LEVELS[lv];
            const newPlats = generatePlatforms(topY - cfg.platGap, 5, lv);
            platformsRef.current = [...newPlats, ...platformsRef.current];
            newPlats.forEach(p => {
              if (Math.random() < cfg.monsterChance) monstersRef.current.push(spawnMonster(p));
            });
          }

          const activeMonsterPlats = new Set(monstersRef.current.map(m => m.platform));
          platformsRef.current = platformsRef.current.filter(p =>
            p.y < H + 200 || activeMonsterPlats.has(p)
          );
          monstersRef.current = monstersRef.current.filter(m => m.platform.y < H + 200);
        }

        // monster เคลื่อนที่เฉพาะเลเวล 3
        monstersRef.current.forEach(m => {
          if (currentLevelRef.current >= 3) {
            m.x += m.dir * m.speed;
            if (m.x < m.platform.x || m.x > m.platform.x + m.platform.w) m.dir *= -1;
          }
          const monY = m.platform.y - m.h;
          if (Math.abs(m.x - player.x) < 25 && Math.abs(monY - player.y) < 30) {
            gameStateRef.current = 'done';
            setGameState('done');
            setFinalScore(Math.floor(scoreRef.current / 10));
            setStatus('เกมจบแล้ว!');
            if (onGameEnd) onGameEnd({ win: false, stars: 1, level: currentLevelRef.current, metrics: { ...calcJumpMetrics(), final_score: Math.floor(scoreRef.current/10), reason: 'monster' } });
          }
        });

        if (Math.floor(scoreRef.current / 10) >= LEVELS[currentLevelRef.current].targetScore) {
          gameStateRef.current = 'win';
          setGameState('win');
          if (currentLevelRef.current < 3) {
            setUnlockedLevel(prev => Math.max(prev, currentLevelRef.current + 1));
          }
          if (onGameEnd) onGameEnd({ win: true, stars: 3, level: currentLevelRef.current, metrics: { ...calcJumpMetrics(), final_score: Math.floor(scoreRef.current/10), reason: 'win' } });
        }

        if (player.y > H + 100) {
          gameStateRef.current = 'done';
          setGameState('done');
          setFinalScore(Math.floor(scoreRef.current / 10));
          setStatus('ตกลงมาแล้ว! เกมจบ');
          if (onGameEnd) onGameEnd({ win: false, stars: 1, level: currentLevelRef.current, metrics: { ...calcJumpMetrics(), final_score: Math.floor(scoreRef.current/10), reason: 'fall' } });
        }
      }

      // วาด
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc((i * 137) % W, (i * 97) % H, 1.5, 0, 2*Math.PI);
        ctx.fill();
      }

      platformsRef.current.forEach(plat => {
        if (plat.y > -20 && plat.y < H + 20) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.w, PLAT_H, 4);
          ctx.fill();
        }
      });

      monstersRef.current.forEach(m => {
        const py = m.platform.y - m.h;
        if (py > -50 && py < H + 20) {
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👾', m.x, py + m.h/2 + 6);
        }
      });

      const player = playerRef.current;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧑‍🚀', player.x, player.y + 10);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`⭐ ${Math.floor(scoreRef.current / 10)}`, 10, 30);

      const sc = skeletonCanvasRef.current;
      if (sc) {
        const sCtx = sc.getContext('2d');
        sCtx.clearRect(0, 0, sc.width, sc.height);
      }
      if (lastLandmarksRef.current && skeletonCanvasRef.current && gameStateRef.current === 'playing') {
        const sc = skeletonCanvasRef.current;
        const sCtx = sc.getContext('2d');
        const SW = sc.width, SH = sc.height;
        const lm = lastLandmarksRef.current;
        PoseLandmarker.POSE_CONNECTIONS.forEach(({ start, end }) => {
          const s = lm[start], e = lm[end];
          sCtx.beginPath();
          sCtx.moveTo((1 - s.x) * SW, s.y * SH);
          sCtx.lineTo((1 - e.x) * SW, e.y * SH);
          sCtx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
          sCtx.lineWidth = 3;
          sCtx.stroke();
        });
        lm.forEach((point, i) => {
          if (i > 10) {
            sCtx.beginPath();
            sCtx.arc((1 - point.x) * SW, point.y * SH, 5, 0, 2 * Math.PI);
            sCtx.fillStyle = '#facc15';
            sCtx.fill();
          }
        });
      }

      requestAnimationFrame(loop);
    };

    setup();
    return () => {
      isMounted = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);


  const calcJumpMetrics = () => {
    const heights = liftHeightsRef.current;
    const xs = playerXHistoryRef.current;
    const stamps = liftTimestampsRef.current;
    const avgHeight = heights.length > 0 ? heights.reduce((a,b)=>a+b,0)/heights.length : 0;
    const heightVariance = heights.length > 1
      ? heights.reduce((s,h)=>s+(h-avgHeight)**2,0)/(heights.length-1) : 0;
    const consistency = Math.max(0, Math.round((1 - Math.sqrt(heightVariance)/Math.max(avgHeight,0.01))*100));
    const xRange = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0;
    const lateral = Math.min(100, Math.round((xRange / 400) * 100));
    const intervals = stamps.length > 1
      ? stamps.slice(1).map((t,i)=>t-stamps[i]) : [];
    const avgInterval = intervals.length > 0 ? Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length) : null;
    return { lift_count: liftCountRef.current, consistency_score: consistency, lateral_control: lateral, avg_jump_interval_ms: avgInterval };
  };

  const startGame = (level = currentLevel) => {
    if (cdTimerRef.current) { clearInterval(cdTimerRef.current); cdTimerRef.current = null; }
    liftCountRef.current = 0;
    liftHeightsRef.current = [];
    liftTimestampsRef.current = [];
    playerXHistoryRef.current = [];
    const cfg = LEVELS[level];
    setCurrentLevel(level);
    currentLevelRef.current = level;
    const platforms = [];
    for (let i = 0; i < 10; i++) {
      const w = cfg.platWidth[0] + Math.random() * (cfg.platWidth[1] - cfg.platWidth[0]);
      platforms.push({
        x: 40 + Math.random() * (W - w - 80),
        y: H - 60 - i * cfg.platGap,
        w,
      });
    }
    platforms[0] = { x: W/2 - 60, y: H - 60, w: 120 };
    platformsRef.current = platforms;
    monstersRef.current = [];
    playerRef.current = { x: W/2, y: H - 100, vy: 0, onGround: true };
    scoreRef.current = 0;
    prevKneeRef.current = null;
    jumpCooldownRef.current = 0;
    baseShoulderRef.current = null;
    calibratedRef.current = false;
    lastLandmarksRef.current = null;
    if (skeletonCanvasRef.current) {
      skeletonCanvasRef.current.getContext('2d').clearRect(0, 0, skeletonCanvasRef.current.width, skeletonCanvasRef.current.height);
    }
    setScore(0);
    setFinalScore(null);
    setGameState('countdown');
    gameStateRef.current = 'countdown';
    setShowLevelSelect(false);

    let count = 3;
    setCountdownNum(count);
    const playBeep = (freq) => {
          try {
            const actx = new AudioContext();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, actx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.3);
            osc.start();
            osc.stop(actx.currentTime + 0.3);
          } catch(e) {}
        };

        playBeep(440);
        cdTimerRef.current = setInterval(() => {
          count -= 1;
          setCountdownNum(count);
          if (count <= 0) {
            clearInterval(cdTimerRef.current); cdTimerRef.current = null;
            playBeep(880);
            setStatus('เอนซ้าย-ขวาเพื่อขยับ ยกเข่าเพื่อกระโดด!');
            setGameState('playing');
            gameStateRef.current = 'playing';
          } else {
            playBeep(440);
          }
        }, 1000);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">🚀 Jump Game</h2>


      <div className="flex gap-4 justify-center items-start">
        <div className="relative" style={{ width: W, height: H }}>
          <canvas ref={canvasRef} width={W} height={H} className="rounded-xl" />

          {gameState === 'win' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 rounded-xl">
              <p className="text-6xl mb-2 animate-bounce">🏆</p>
              <p className="text-3xl font-bold text-yellow-400">ผ่านเลเวล {currentLevel}!</p>
              {currentLevel < 3 && (
                <p className="text-green-400 mt-1">🔓 ปลดล็อคเลเวล {currentLevel + 1} แล้ว!</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowLevelSelect(true); setGameState('idle'); }}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl text-white font-semibold"
                >
                  เลือกเลเวล
                </button>
                {currentLevel < 3 && (
                  <button
                    onClick={() => startGame(currentLevel + 1)}
                    className="bg-yellow-500 hover:bg-yellow-400 px-4 py-2 rounded-xl text-white font-semibold"
                  >
                    เลเวล {currentLevel + 1} →
                  </button>
                )}
              </div>
            </div>
          )}

          {finalScore !== null && gameState === 'done' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-xl">
              <p className="text-5xl mb-2">💀</p>
              <p className="text-3xl font-bold text-white">เกมจบ!</p>
              <p className="text-xl text-yellow-400 mt-2">⭐ {finalScore} / {LEVELS[currentLevel].targetScore} คะแนน</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowLevelSelect(true); setGameState('idle'); setFinalScore(null); }}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl text-white font-semibold"
                >
                  เลือกเลเวล
                </button>
                <button
                  onClick={() => startGame(currentLevel)}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-white font-semibold"
                >
                  🔄 ลองใหม่
                </button>
              </div>
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

          {gameState === 'playing' && (
            <>
              <div className="absolute top-2 left-2 right-2 flex justify-between">
                <span className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                  {LEVELS[currentLevel].emoji} Lv.{currentLevel}
                </span>
                <span className="bg-black bg-opacity-60 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ {score} / {LEVELS[currentLevel].targetScore}
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <p className="text-yellow-400 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">{status}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative" style={{ width: 240, height: 320 }}>
            <video
              ref={videoRef}
              autoPlay
              className="absolute top-0 left-0 w-full h-full rounded-xl object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={skeletonCanvasRef}
              width={240}
              height={320}
              className="absolute top-0 left-0 rounded-xl"
              style={{ pointerEvents: 'none' }}
            />
          </div>
          <p className="text-yellow-400 text-sm">{status}</p>
          {gameState === 'playing' && (
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-2xl font-bold text-yellow-400">⭐ {score}</p>
              <p className="text-gray-400 text-sm">เป้า {LEVELS[currentLevel].targetScore}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JumpGame;