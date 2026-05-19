import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker, FaceLandmarker } from '@mediapipe/tasks-vision';

function GunGame({ startLevel = 1, onGameEnd }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const gameStateRef = useRef('idle');
  const birdsRef = useRef([]);
  const scoreRef = useRef(0);
  const bulletsRef = useRef([]);
  const lastExprRef = useRef(false);
  const shootCooldownRef = useRef(0);
  const bowImgRef = useRef(null);
  const vultureImgRef = useRef(null);
  const arrowImgRef = useRef(null);
  const goodBirdImgRef = useRef(null);
  const ammoRef = useRef(3);
  const reloadingRef = useRef(false);
  const reloadTimerRef = useRef(0);
  const currentExprRef = useRef(null);
  const exprTimerRef = useRef(0);
  const currentLevelRef = useRef(1);
  const frameCountRef = useRef(0);
  const lastHandResultsRef = useRef(null);
  const lastFaceResultsRef = useRef({ faceBlendshapes: [] });
  const cdTimerRef = useRef(null);
  const birdSpawnRef = useRef(null);
  const shotsFiredRef = useRef(0);
  const shotsHitRef = useRef(0);
  const exprSpeedsRef = useRef([]);
  const exprStartTimeRef = useRef(null);

  const [gameState, setGameState] = useState('idle');
  const [status, setStatus] = useState('กำลังโหลด AI...');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finalScore, setFinalScore] = useState(null);
  const [ammo, setAmmo] = useState(3);
  const [reloading, setReloading] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(3);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  useEffect(() => {
    if (startLevel) startGame(startLevel);
  }, []);
  const [currentExpr, setCurrentExpr] = useState(null);

  const W = 600, H = 450;

  const LEVELS = {
    1: {
      name: 'มือใหม่', emoji: '🌱', color: 'bg-green-600',
      description: 'ยิ้ม + อ้าปาก ฝึกกล้ามเนื้อใบหน้าพื้นฐาน',
      birdSpeed: [1.5, 2.5], goodBirdChance: 0,
      expressions: [
        { name: 'ยิ้ม', icon: '😊', key: 'smile', threshold: 0.5 },
        { name: 'อ้าปาก', icon: '😮', key: 'jawOpen', threshold: 0.4 },
      ]
    },
    2: {
      name: 'ปานกลาง', emoji: '⚡', color: 'bg-yellow-600',
      description: 'ยกคิ้ว + ปากจู๋ + ขมวดคิ้ว ฝึกกล้ามเนื้อใบหน้าขั้นกลาง',
      birdSpeed: [2.5, 4], goodBirdChance: 0.25,
      expressions: [
        { name: 'ยกคิ้ว', icon: '🤨', key: 'browUp', threshold: 0.4 },
        { name: 'ปากจู๋', icon: '😗', key: 'mouthPucker', threshold: 0.4 },
        { name: 'ขมวดคิ้ว', icon: '😠', key: 'browDown', threshold: 0.4 },
      ]
    },
    3: {
      name: 'ผู้เชี่ยวชาญ', emoji: '💀', color: 'bg-red-600',
      description: 'ทุก expression นกเร็วมาก ฝึกกล้ามเนื้อใบหน้าครบชุด',
      birdSpeed: [3.5, 5.5], goodBirdChance: 0.35,
      expressions: [
        { name: 'ยิ้ม', icon: '😊', key: 'smile', threshold: 0.5 },
        { name: 'อ้าปาก', icon: '😮', key: 'jawOpen', threshold: 0.4 },
        { name: 'ยกคิ้ว', icon: '🤨', key: 'browUp', threshold: 0.4 },
        { name: 'ปากจู๋', icon: '😗', key: 'mouthPucker', threshold: 0.4 },
        { name: 'ขมวดคิ้ว', icon: '😠', key: 'browDown', threshold: 0.4 },
      ]
    },
  };

  const playSound = (freq, duration = 0.2, type = 'square') => {
    try {
      const actx = new AudioContext();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain); gain.connect(actx.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
      osc.start(); osc.stop(actx.currentTime + duration);
    } catch(e) {}
  };

  const playShootSound = () => {
    try {
      const actx = new AudioContext();
      const bufferSize = actx.sampleRate * 0.1;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const source = actx.createBufferSource();
      source.buffer = buffer;
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.5, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.1);
      source.connect(gain); gain.connect(actx.destination); source.start();
    } catch(e) {}
  };

  const drawBow = (ctx) => {
    if (!bowImgRef.current) return;
    ctx.drawImage(bowImgRef.current, -40, -30, 80, 60);
  };

  const drawVulture = (ctx) => {
    if (!vultureImgRef.current) {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🦅', 0, 10);
      return;
    }
    ctx.drawImage(vultureImgRef.current, -40, -40, 80, 80);
  };

  const pickRandomExpr = (level) => {
    const exprs = LEVELS[level].expressions;
    return exprs[Math.floor(Math.random() * exprs.length)];
  };

  const spawnBird = (good = false) => {
    const lv = currentLevelRef.current;
    const [minSpd, maxSpd] = LEVELS[lv].birdSpeed;
    const speed = minSpd + Math.random() * (maxSpd - minSpd);
    return {
      id: Date.now() + Math.random(),
      x: Math.random() > 0.5 ? -40 : W + 40,
      y: 60 + Math.random() * (H - 120),
      vx: (Math.random() > 0.5 ? 1 : -1) * speed,
      vy: (Math.random() - 0.5) * 1.2,
      hit: false, hitTimer: 0, good,
    };
  };

  const checkExpression = (shapes, exprKey) => {
    if (!shapes) return false;
    switch(exprKey) {
      case 'smile': {
        const l = shapes.find(s => s.categoryName === 'mouthSmileLeft');
        const r = shapes.find(s => s.categoryName === 'mouthSmileRight');
        return (l?.score > 0.5) && (r?.score > 0.5);
      }
      case 'jawOpen': {
        const j = shapes.find(s => s.categoryName === 'jawOpen');
        return j?.score > 0.4;
      }
      case 'browUp': {
        const l = shapes.find(s => s.categoryName === 'browOuterUpLeft');
        const r = shapes.find(s => s.categoryName === 'browOuterUpRight');
        return (l?.score > 0.4) || (r?.score > 0.4);
      }
      case 'mouthPucker': {
        const p = shapes.find(s => s.categoryName === 'mouthPucker');
        const f = shapes.find(s => s.categoryName === 'mouthFunnel');
        return (p?.score > 0.35) && (f?.score > 0.25);
      }
      case 'browDown': {
        const l = shapes.find(s => s.categoryName === 'browDownLeft');
        const r = shapes.find(s => s.categoryName === 'browDownRight');
        return (l?.score > 0.3) && (r?.score > 0.2);
      }
      default: return false;
    }
  };

  useEffect(() => {
    let stream;
    let isMounted = true;

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'GPU' },
        runningMode: 'VIDEO', numHands: 1,
        minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'GPU' },
        runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
      });

      const base = process.env.PUBLIC_URL || '';
      for (const [ref, src] of [
        [bowImgRef, `${base}/bow.png`], [vultureImgRef, `${base}/vulture.png`],
        [arrowImgRef, `${base}/arrow.png`], [goodBirdImgRef, `${base}/bird_good.png`]
      ]) {
        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => { ref.current = img; resolve(); };
          img.onerror = resolve;
          img.src = src;
        });
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 20 }
      });
      if (!isMounted || !videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        if (!isMounted) return;
        setStatus('พร้อมแล้ว!');
        loop();
      };
    };

    const loop = () => {
      if (!handLandmarkerRef.current || !faceLandmarkerRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      if (videoRef.current.readyState < 2) { requestAnimationFrame(loop); return; }

      const now = performance.now();
      frameCountRef.current += 1;
      if (frameCountRef.current % 2 === 0) {
        lastHandResultsRef.current = handLandmarkerRef.current.detectForVideo(videoRef.current, now);
      }
      if (frameCountRef.current % 3 === 0) {
        lastFaceResultsRef.current = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
      }
      const handResults = lastHandResultsRef.current || { landmarks: [] };
      const faceResults = lastFaceResultsRef.current || { faceBlendshapes: [] };

      ctx.clearRect(0, 0, W, H);

      let fx = null, fy = null, gunAngle = 0;
      if (handResults.landmarks?.length > 0) {
        const lm = handResults.landmarks[0];
        const tip = lm[8], base = lm[5];
        fx = (1 - tip.x) * W; fy = tip.y * H;
        gunAngle = Math.atan2(fy - base.y * H, fx - (1 - base.x) * W);
      }

      // เช็ค expression ปัจจุบัน
      let exprMatched = false;
      const shapes = faceResults.faceBlendshapes?.[0]?.categories;
      if (shapes && currentExprRef.current) {
        exprMatched = checkExpression(shapes, currentExprRef.current.key);
      }

      // อัพเดท expr timer - สลับเมื่อครบ 5 วิ หรือยิงได้แล้ว
      if (gameStateRef.current === 'playing') {
        exprTimerRef.current -= 1;
        if (exprTimerRef.current <= 0) {
          // สุ่ม expression ใหม่ที่ไม่ซ้ำกับอันเดิม
          const exprs = LEVELS[currentLevelRef.current].expressions;
          let newExpr;
          do {
            newExpr = exprs[Math.floor(Math.random() * exprs.length)];
          } while (exprs.length > 1 && newExpr.key === currentExprRef.current?.key);
          currentExprRef.current = newExpr;
          setCurrentExpr(newExpr);
          exprTimerRef.current = 300;
          exprStartTimeRef.current = Date.now();
        }
      }

      // ยิง
      if (exprMatched && !lastExprRef.current && fx !== null &&
          shootCooldownRef.current <= 0 && !reloadingRef.current && ammoRef.current > 0 &&
          gameStateRef.current === 'playing') {
        bulletsRef.current.push({ x: fx, y: fy, vx: Math.cos(gunAngle) * 14, vy: Math.sin(gunAngle) * 14 });
        ammoRef.current -= 1;
        setAmmo(ammoRef.current);
        shootCooldownRef.current = 10;
        shotsFiredRef.current += 1;
        playShootSound();

        // สลับ expression ทันทีหลังยิง
        const exprs = LEVELS[currentLevelRef.current].expressions;
        let newExpr;
        do {
          newExpr = exprs[Math.floor(Math.random() * exprs.length)];
        } while (exprs.length > 1 && newExpr.key === currentExprRef.current?.key);
        currentExprRef.current = newExpr;
        setCurrentExpr(newExpr);
        exprTimerRef.current = 300;

        if (ammoRef.current <= 0) {
          reloadingRef.current = true;
          reloadTimerRef.current = 1.5;
          setReloading(true);
          const reloadInterval = setInterval(() => {
            reloadTimerRef.current -= 0.5;
            if (reloadTimerRef.current <= 0) {
              clearInterval(reloadInterval);
              ammoRef.current = 3; setAmmo(3);
              reloadingRef.current = false; setReloading(false);
              playSound(660, 0.15, 'square');
            }
          }, 500);
        }
      }
      lastExprRef.current = exprMatched;
      if (shootCooldownRef.current > 0) shootCooldownRef.current -= 1;

      if (gameStateRef.current === 'playing') {
        bulletsRef.current = bulletsRef.current.filter(b => {
          b.x += b.vx; b.y += b.vy;
          return b.x > 0 && b.x < W && b.y > 0 && b.y < H;
        });

        birdsRef.current.forEach(bird => {
          if (bird.hit) { bird.hitTimer -= 1; bird.y += 4; return; }
          bird.x += bird.vx; bird.y += bird.vy;
          if (bird.x < -50) bird.x = W + 40;
          if (bird.x > W + 50) bird.x = -40;
          if (bird.y < 40 || bird.y > H - 40) bird.vy *= -1;

          bulletsRef.current.forEach((b, bi) => {
            const dist = Math.sqrt((b.x - bird.x) ** 2 + (b.y - bird.y) ** 2);
            if (dist < 40) {
              bird.hit = true; bird.hitTimer = 20;
              if (bird.good) {
                scoreRef.current = Math.max(0, scoreRef.current - 3);
                playSound(200, 0.3, 'sawtooth');
              } else {
                scoreRef.current += 1;
                shotsHitRef.current += 1;
                if (exprStartTimeRef.current) { exprSpeedsRef.current.push(Date.now() - exprStartTimeRef.current); exprStartTimeRef.current = null; }
                playSound(880, 0.1, 'square');
              }
              setScore(scoreRef.current);
              if (scoreRef.current >= 10 && gameStateRef.current === 'playing') {
                gameStateRef.current = 'done';
                setGameState('done');
                setFinalScore(scoreRef.current);
                if (currentLevelRef.current < 3) setUnlockedLevel(prev => Math.max(prev, currentLevelRef.current + 1));
                const fired = shotsFiredRef.current;
                const hit = shotsHitRef.current;
                const avgExprSpeed = exprSpeedsRef.current.length > 0
                  ? Math.round(exprSpeedsRef.current.reduce((a, b) => a + b, 0) / exprSpeedsRef.current.length)
                  : null;
                if (onGameEnd) onGameEnd({
                  win: true,
                  stars: scoreRef.current >= 15 ? 3 : scoreRef.current >= 8 ? 2 : 1,
                  level: currentLevelRef.current,
                  metrics: {
                    shots_fired: fired,
                    shots_hit: hit,
                    accuracy: fired > 0 ? Math.round((hit / fired) * 100) : 0,
                    avg_expr_speed_ms: avgExprSpeed,
                    final_score: scoreRef.current
                  }
                });
              }
              bulletsRef.current.splice(bi, 1);
            }
          });
        });

        birdsRef.current = birdsRef.current.filter(b => !b.hit || b.hitTimer > 0);
      }

      // วาดนก
      birdsRef.current.forEach(bird => {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        if (bird.vx < 0) ctx.scale(-1, 1);
        if (bird.hit) {
          ctx.globalAlpha = 0.5;
          ctx.font = '40px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('💥', 0, 0);
        } else if (bird.good && goodBirdImgRef.current) {
          ctx.scale(-1, 1);
          ctx.drawImage(goodBirdImgRef.current, -30, -30, 60, 60);
        } else if (!bird.good) {
          drawVulture(ctx);
        } else {
          ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('🐦', 0, 0);
        }
        ctx.restore();
      });

      // วาด bullet
      bulletsRef.current.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        if (arrowImgRef.current) {
          ctx.drawImage(arrowImgRef.current, -20, -8, 40, 16);
        } else {
          ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
        }
        ctx.restore();
      });

      // วาดธนู
      if (fx !== null) {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(gunAngle);
        drawBow(ctx);
        ctx.restore();

        ctx.strokeStyle = reloadingRef.current ? '#6b7280' : (exprMatched ? '#ef4444' : 'rgba(255,255,255,0.6)');
        ctx.lineWidth = 2;
        const cx = fx + Math.cos(gunAngle) * 80;
        const cy = fy + Math.sin(gunAngle) * 80;
        ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI); ctx.stroke();
      }

      // UI คะแนน + ammo
      if (gameStateRef.current === 'playing') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎯 ${scoreRef.current}`, 10, 30);

        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < ammoRef.current ? '#facc15' : '#374151';
          ctx.fillRect(10 + i * 18, 40, 12, 20);
          ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1;
          ctx.strokeRect(10 + i * 18, 40, 12, 20);
        }

        // วาด expression box
        if (currentExprRef.current) {
          const expr = currentExprRef.current;
          const boxW = 120, boxH = 80;
          const bx = W - boxW - 10, by = 10;
          ctx.fillStyle = exprMatched ? 'rgba(34,197,94,0.85)' : 'rgba(0,0,0,0.75)';
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = exprMatched ? '#22c55e' : '#6b7280';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(expr.icon, bx + boxW/2, by + 42);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(expr.name, bx + boxW/2, by + 65);

          // progress bar เวลาที่เหลือ
          const timeProgress = exprTimerRef.current / 300;
          ctx.fillStyle = '#374151';
          ctx.fillRect(bx + 10, by + boxH + 5, boxW - 20, 6);
          ctx.fillStyle = timeProgress > 0.3 ? '#22c55e' : '#ef4444';
          ctx.fillRect(bx + 10, by + boxH + 5, (boxW - 20) * timeProgress, 6);
        }

        if (reloadingRef.current) {
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(0, H/2 - 50, W, 100);
          const blink = Math.floor(Date.now() / 300) % 2 === 0;
          ctx.fillStyle = blink ? '#ef4444' : '#991b1b';
          ctx.font = 'bold 32px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠ RELOADING ⚠', W/2, H/2 - 10);
          const progress = 1 - (reloadTimerRef.current / 1.5);
          ctx.fillStyle = '#374151';
          ctx.fillRect(W/2 - 120, H/2 + 10, 240, 16);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(W/2 - 120, H/2 + 10, 240 * progress, 16);
          ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1;
          ctx.strokeRect(W/2 - 120, H/2 + 10, 240, 16);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(`${reloadTimerRef.current.toFixed(1)}s`, W/2, H/2 + 40);
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
    if (cdTimerRef.current) { clearInterval(cdTimerRef.current); cdTimerRef.current = null; }
    if (birdSpawnRef.current) { clearInterval(birdSpawnRef.current); birdSpawnRef.current = null; }
    shotsFiredRef.current = 0;
    shotsHitRef.current = 0;
    exprSpeedsRef.current = [];
    exprStartTimeRef.current = null;
    setCurrentLevel(level);
    currentLevelRef.current = level;
    scoreRef.current = 0;
    bulletsRef.current = [];
    lastExprRef.current = false;
    shootCooldownRef.current = 0;
    ammoRef.current = 3;
    reloadingRef.current = false;
    reloadTimerRef.current = 0;
    exprTimerRef.current = 1; // สุ่ม expression ทันที
    const firstExpr = pickRandomExpr(level);
    currentExprRef.current = firstExpr;
    setCurrentExpr(firstExpr);
    setScore(0); setAmmo(3); setFinalScore(null);
    setGameState('countdown');
    gameStateRef.current = 'countdown';
    setCountdownNum(3);
    setShowLevelSelect(false);

    birdsRef.current = [];
    const goodChance = LEVELS[level].goodBirdChance;
    for (let i = 0; i < 3; i++) birdsRef.current.push(spawnBird(false));
    if (goodChance > 0) birdsRef.current.push(spawnBird(true));

    const playBeep = (freq) => playSound(freq, 0.3, 'sine');
    playBeep(440);
    let c = 3;
    cdTimerRef.current = setInterval(() => {
      c -= 1; setCountdownNum(c);
      if (c <= 0) {
        clearInterval(cdTimerRef.current); cdTimerRef.current = null;
        playBeep(880);
        setGameState('playing');
        gameStateRef.current = 'playing';
        setStatus(`ทำหน้า ${currentExprRef.current?.icon} แล้วยิง!`);

        exprStartTimeRef.current = Date.now();
        birdSpawnRef.current = setInterval(() => {
          if (gameStateRef.current !== 'playing') { clearInterval(birdSpawnRef.current); birdSpawnRef.current = null; return; }
          const alive = birdsRef.current.filter(b => !b.hit);
          const gc = LEVELS[currentLevelRef.current].goodBirdChance;
          if (alive.length < 4) {
            birdsRef.current.push(spawnBird(false));
            if (Math.random() < gc) birdsRef.current.push(spawnBird(true));
          }
        }, 2000);
      } else playBeep(440);
    }, 1000);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">🏹 Bow Game</h2>

      

      <div className="relative w-full" style={{ height: '450px' }}>
        <video ref={videoRef} autoPlay
          className="w-full h-full rounded-xl object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }} />

        {gameState === 'playing' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
            🎯 {score}/10
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

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-xl">
            <p className="text-4xl mb-3">🏹</p>
            <p className="text-white text-lg mb-1">👆 ชี้นิ้วเพื่อเล็ง</p>
            <p className="text-white text-lg mb-4">😊 ทำหน้าตามที่สั่งเพื่อยิง!</p>
          </div>
        )}

        {finalScore !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-xl">
            <p className="text-5xl mb-2">🏹</p>
            <p className="text-3xl font-bold text-white">เกมจบ!</p>
            <p className="text-xl text-yellow-400 mt-2">ยิงโดน {finalScore} นก</p>
            {finalScore >= 15 && <p className="text-yellow-400 mt-1">🌟 นักธนูระดับเทพ!</p>}
            {finalScore >= 8 && finalScore < 15 && <p className="text-blue-400 mt-1">👍 ยอดเยี่ยม!</p>}
            {finalScore < 8 && <p className="text-red-400 mt-1">💪 ฝึกเพิ่มนะ!</p>}
            {currentLevel < 3 && <p className="text-green-400 mt-1">🔓 ปลดล็อคเลเวล {currentLevel + 1} แล้ว!</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowLevelSelect(true); setFinalScore(null); setGameState('idle'); }}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-xl text-white font-semibold">
                เลือกเลเวล
              </button>
              <button onClick={() => startGame(currentLevel)}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-white font-semibold">
                🔄 ลองใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-yellow-400 font-semibold mt-2">{status}</p>
    </div>
  );
}

export default GunGame;