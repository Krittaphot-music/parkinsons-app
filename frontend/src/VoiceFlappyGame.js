import React, { useRef, useEffect, useState } from 'react';

const W = 600, H = 600;
const PIPE_W = 52;
const BIRD_R = 14;

const LEVELS = {
  1: { name: 'Easy',   emoji: '🌱', gap: 220, pipeSpeed: 1,   pipeInterval: 250, target: 10 },
  2: { name: 'Normal', emoji: '⚡', gap: 170, pipeSpeed: 1, pipeInterval: 230, target: 10 },
  3: { name: 'Hard',   emoji: '💀', gap: 120, pipeSpeed: 1, pipeInterval: 200, target: 10 },
};

function VoiceFlappyGame({ startLevel = 1 }) {
  const canvasRef      = useRef(null);
  const gameStateRef   = useRef('idle');
  const birdRef        = useRef({ x: 80, y: H / 2, vy: 0 });
  const pipesRef       = useRef([]);
  const scoreRef       = useRef(0);
  const frameRef       = useRef(0);
  const volumeRef      = useRef(0);
  const currentLevelRef = useRef(startLevel);
  const animRef        = useRef(null);
  const analyserRef    = useRef(null);
  const volumeDataRef  = useRef(null);
  const micStreamRef   = useRef(null);
  const bgImgRef       = useRef(null);
  const bgOffsetRef    = useRef(0);
  const birdImgRef     = useRef(null);
  const pipeImgRef     = useRef(null);

  const [gameState,      setGameState]      = useState('idle');
  const [score,          setScore]          = useState(0);
  const [countdownNum,   setCountdownNum]   = useState(3);
  const [currentLevel,   setCurrentLevel]   = useState(startLevel);
  const [highScore,      setHighScore]      = useState(0);
  const [finalScore,     setFinalScore]     = useState(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [micReady,       setMicReady]       = useState(false);

  useEffect(() => {
    setHighScore(Number(localStorage.getItem(`flappy_hs_lv${startLevel}`) || 0));
  }, [startLevel]);

  useEffect(() => {
    let isMounted = true;

    const loadImg = (src) => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    const setup = async () => {
      [bgImgRef.current, birdImgRef.current, pipeImgRef.current] = await Promise.all([
        loadImg('/flappy_bg.png'),
        loadImg('/flappy_bird.png'),
        loadImg('/flappy_pipe.png'),
      ]);
      if (!isMounted) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
        micStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        volumeDataRef.current = new Uint8Array(analyser.frequencyBinCount);
        if (isMounted) setMicReady(true);
      } catch (e) {
        console.warn('Microphone unavailable:', e);
      }

      if (!isMounted) return;
      startGame(startLevel);
      loop();
    };

    const getVolume = () => {
      if (!analyserRef.current || !volumeDataRef.current) return 0;
      analyserRef.current.getByteFrequencyData(volumeDataRef.current);
      const sum = volumeDataRef.current.reduce((a, b) => a + b, 0);
      return sum / volumeDataRef.current.length / 255;
    };

    const loop = () => {
      if (!isMounted) return;
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');

      volumeRef.current = getVolume();
      const lv  = LEVELS[currentLevelRef.current];
      const bird = birdRef.current;

      // Background
      if (bgImgRef.current) {
        bgOffsetRef.current = (bgOffsetRef.current + 0.5) % W;
        const o = bgOffsetRef.current;
        ctx.drawImage(bgImgRef.current, -o, 0, W, H);
        ctx.drawImage(bgImgRef.current, W - o, 0, W, H);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#b0e0f8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      if (gameStateRef.current === 'playing') {
        frameRef.current += 1;

        // Bird physics — volume lifts the bird
        const vol = volumeRef.current;
        const smoothVol = volumeRef.current * 0.3 + vol * 0.7;
        volumeRef.current = smoothVol;
        const lift = smoothVol > 0.04 ? (smoothVol - 0.04) * 0.4 : 0;
        bird.vy += 0.01;
        bird.vy -= lift;
        bird.vy = Math.max(-1, Math.min(bird.vy, 4));
        bird.y += bird.vy;

        // Spawn pipes
        if (frameRef.current % lv.pipeInterval === 0) {
          const gapY = 80 + Math.random() * (H - 200 - lv.gap);
          pipesRef.current.push({ x: W + 30, gapY, scored: false });
        }

        // Move pipes & count score
        pipesRef.current.forEach(p => {
          p.x -= lv.pipeSpeed;
          if (!p.scored && p.x + PIPE_W < bird.x) {
            p.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        });
        pipesRef.current = pipesRef.current.filter(p => p.x > -80);

        // Collision
        let dead = bird.y - BIRD_R < 0 || bird.y + BIRD_R > H - 20;
        if (!dead) {
          for (const p of pipesRef.current) {
            if (bird.x + BIRD_R > p.x && bird.x - BIRD_R < p.x + PIPE_W) {
              if (bird.y - BIRD_R < p.gapY || bird.y + BIRD_R > p.gapY + lv.gap) {
                dead = true; break;
              }
            }
          }
        }
        if (scoreRef.current >= lv.target) {
          gameStateRef.current = 'win';
          setGameState('win');
          const key = `flappy_hs_lv${currentLevelRef.current}`;
          const hs = Number(localStorage.getItem(key) || 0);
          if (scoreRef.current > hs) {
            localStorage.setItem(key, scoreRef.current);
            setHighScore(scoreRef.current);
          }
        }
        if (dead) {
          gameStateRef.current = 'dead';
          setGameState('dead');
          const finalSc = scoreRef.current;
          setFinalScore(finalSc);
          const key = `flappy_hs_lv${currentLevelRef.current}`;
          const hs = Number(localStorage.getItem(key) || 0);
          if (finalSc > hs) {
            localStorage.setItem(key, finalSc);
            setHighScore(finalSc);
            setIsNewHighScore(true);
          }
        }
      }

      // Draw pipes
      pipesRef.current.forEach(p => {
        if (pipeImgRef.current) {
          // Top pipe — flip vertically
          ctx.save();
          ctx.translate(p.x, p.gapY);
          ctx.scale(1, -1);
          ctx.drawImage(pipeImgRef.current, 0, 0, PIPE_W, p.gapY);
          ctx.restore();
          // Bottom pipe
          ctx.drawImage(pipeImgRef.current, p.x, p.gapY + lv.gap, PIPE_W, H - p.gapY - lv.gap);
        } else {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
          ctx.fillRect(p.x, p.gapY + lv.gap, PIPE_W, H - p.gapY - lv.gap);
          ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2;
          ctx.strokeRect(p.x, 0, PIPE_W, p.gapY);
          ctx.strokeRect(p.x, p.gapY + lv.gap, PIPE_W, H - p.gapY - lv.gap);
        }
      });

      // Ground
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = '#a87550';
      ctx.fillRect(0, H - 20, W, 4);

      // Bird
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.min(Math.max(bird.vy * 3, -30), 60) * Math.PI / 180);
      if (birdImgRef.current) {
        ctx.drawImage(birdImgRef.current, -20, -20, 40, 40);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(28, -5); ctx.lineTo(28, 5); ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // Volume meter (left side)
      const vol = volumeRef.current;
      const mH = 160, mX = 10, mY = H / 2 - mH / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.roundRect(mX, mY, 16, mH, 4); ctx.fill();
      const fillH = Math.min(vol * mH * 2, mH);
      ctx.fillStyle = vol < 0.25 ? '#22c55e' : vol < 0.55 ? '#eab308' : '#ef4444';
      if (fillH > 0) { ctx.beginPath(); ctx.roundRect(mX, mY + mH - fillH, 16, fillH, 4); ctx.fill(); }
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🎤', mX + 8, mY - 6);

      // Score
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(`${scoreRef.current}`, W / 2, 52);
      ctx.fillStyle = 'white';
      ctx.fillText(`${scoreRef.current}`, W / 2, 52);

      animRef.current = requestAnimationFrame(loop);
    };

    setup();
    return () => {
      isMounted = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startGame = (level) => {
    setCurrentLevel(level);
    currentLevelRef.current = level;
    birdRef.current = { x: 80, y: H / 2, vy: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    setScore(0);
    setFinalScore(null);
    setIsNewHighScore(false);
    setHighScore(Number(localStorage.getItem(`flappy_hs_lv${level}`) || 0));
    setGameState('countdown');
    gameStateRef.current = 'countdown';
    setCountdownNum(3);

    let c = 3;
    const cd = setInterval(() => {
      c -= 1;
      setCountdownNum(c);
      if (c <= 0) {
        clearInterval(cd);
        setGameState('playing');
        gameStateRef.current = 'playing';
      }
    }, 1000);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🐥 Voice Flappy Bird</h2>

      {!micReady && (
        <p style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
          ⚠️ กรุณาอนุญาต Microphone ในเบราว์เซอร์
        </p>
      )}

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ borderRadius: 12, display: 'block' }} />

        {gameState === 'countdown' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <p style={{ fontSize: 96, fontWeight: 900, color: '#facc15', margin: 0, lineHeight: 1 }}>{countdownNum}</p>
            <p style={{ color: 'white', fontSize: 18, margin: 0 }}>เตรียมตัว!</p>
          </div>
        )}
        {gameState === 'win' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 56 }}>🏆</div>
            <p style={{ color: '#facc15', fontSize: 28, fontWeight: 700, margin: 0 }}>ผ่านแล้ว!</p>
            <p style={{ color: 'white', fontSize: 40, fontWeight: 900, margin: 0 }}>{scoreRef.current}</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>คะแนน</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => startGame(currentLevel)} style={{
                background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 700,
              }}>🔄 ลองใหม่</button>
              <button onClick={() => { setGameState('idle'); gameStateRef.current = 'idle'; }} style={{
                background: '#4b5563', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 700,
              }}>เลือกเลเวล</button>
            </div>
          </div>
        )}
        {gameState === 'dead' && finalScore !== null && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 56 }}>💥</div>
            <p style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: 0 }}>เกมจบ!</p>
            <p style={{ color: '#facc15', fontSize: 40, fontWeight: 900, margin: 0 }}>{finalScore}</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>คะแนน</p>
            {isNewHighScore && finalScore > 0 && (
              <p style={{ color: '#34d399', fontSize: 14, fontWeight: 700, margin: 0 }}>🏆 สถิติใหม่!</p>
            )}
            <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>สถิติ: {highScore}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => startGame(currentLevel)} style={{
                background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 700,
              }}>🔄 ลองใหม่</button>
              <button onClick={() => { setGameState('idle'); gameStateRef.current = 'idle'; }} style={{
                background: '#4b5563', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 700,
              }}>เลือกเลเวล</button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ background: 'rgba(0,0,0,0.55)', color: '#facc15', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {LEVELS[currentLevel].emoji} {LEVELS[currentLevel].name}
            </span>
            <span style={{ background: 'rgba(0,0,0,0.55)', color: '#9ca3af', padding: '3px 10px', borderRadius: 20, fontSize: 10 }}>
              Best {highScore}
            </span>
          </div>
        )}
      </div>

      <p style={{ color: '#fbbf24', fontWeight: 700, marginTop: 8, fontSize: 13 }}>
        {gameState === 'playing' ? '🎤 พูดหรือร้องเพื่อบิน!' :
         gameState === 'idle'    ? 'เลือกเลเวลแล้วเริ่มเลย!' : ''}
      </p>
    </div>
  );
}

export default VoiceFlappyGame;
