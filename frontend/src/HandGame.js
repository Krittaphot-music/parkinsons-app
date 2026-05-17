import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

function HandGame({ onGameEnd }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const gameStateRef = useRef('idle');
  const circlesRef = useRef([]);
  const ballRef = useRef(null);
  const scoreRef = useRef(0);
  const missRef = useRef(0);
  const modeRef = useRef('tap');

  const [status, setStatus] = useState('กำลังโหลด AI...');
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);

  const W = 600;
  const H = 450;

  useEffect(() => {
    let stream;
    let smoothFx = null, smoothFy = null;
    const SMOOTH = 0.35;

    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        setStatus('พร้อมแล้ว! เลือกโหมดแล้วกดเริ่ม');
        loop();
      };
    };

    const loop = () => {
      if (!handLandmarkerRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      const results = handLandmarkerRef.current.detectForVideo(
        videoRef.current, performance.now()
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let fx = null, fy = null;
      if (results.landmarks && results.landmarks.length > 0) {
        const tip = results.landmarks[0][8];
        const rawFx = fx = (1 - tip.x) * W;
        const rawFy = tip.y * H;
        smoothFx = smoothFx === null ? rawFx : smoothFx + SMOOTH * (rawFx - smoothFx);
        smoothFy = smoothFy === null ? rawFy : smoothFy + SMOOTH * (rawFy - smoothFy);
        fx = smoothFx;
        fy = smoothFy;
      } else {
        smoothFx = null;
        smoothFy = null;
      }

      const now = Date.now();

      if (gameStateRef.current === 'playing') {

        if (modeRef.current === 'tap') {
          const remaining = [];
          for (const c of circlesRef.current) {
            const progress = (now - c.born) / c.life;
            const alpha = 1 - progress;

            if (now - c.born > c.life) {
              missRef.current += 1;
              setTimeLeft(5 - missRef.current);
              continue;
            }

            // เช็คนิ้วแตะก่อนวาด
            let tapped = false;
            if (fx !== null) {
              const dist = Math.sqrt((fx - c.x) ** 2 + (fy - c.y) ** 2);
              if (dist < c.r) {
                scoreRef.current += 1;
                tapped = true;
              }
            }

            if (tapped) continue;

            // วาด timer ring
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r + 8, -Math.PI / 2, -Math.PI / 2 + (1 - progress) * 2 * Math.PI);
            ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.stroke();

            // วาดวงกลม
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.4})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TAP', c.x, c.y);

            remaining.push(c);
          }
          circlesRef.current = remaining;
        }

        // โหมด DRAG
        if (modeRef.current === 'drag' && ballRef.current) {
          const ball = ballRef.current;

          // อัพเดทตำแหน่งลูกบอล
          ball.x += ball.vx;
          ball.y += ball.vy;

          // กระดอนขอบ
          if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
          if (ball.y < ball.r || ball.y > H - ball.r) ball.vy *= -1;

          // เช็คว่านิ้วตามลูกบอลได้ไหม
          let onBall = false;
          if (fx) {
            const dist = Math.sqrt((fx - ball.x) ** 2 + (fy - ball.y) ** 2);
            if (dist < ball.r + 20) {
              onBall = true;
              ball.followTime += 1;
              if (ball.followTime >= ball.needed) {
                scoreRef.current += 1;
                spawnBall();
              }
            }
          }

          // วาด progress bar รอบลูกบอล
          if (ball.followTime > 0) {
            const progress = ball.followTime / ball.needed;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r + 12, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 4;
            ctx.stroke();
          }

          // วาด trail
          ball.trail.push({ x: ball.x, y: ball.y });
          if (ball.trail.length > 20) ball.trail.shift();

          ball.trail.forEach((p, i) => {
            const alpha = i / ball.trail.length * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, ball.r * (i / ball.trail.length), 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.fill();
          });

          // วาดลูกบอล
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
          ctx.fillStyle = onBall ? '#22c55e' : '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // วาด zone รอบลูกบอล
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r + 20, 0, 2 * Math.PI);
          ctx.strokeStyle = onBall ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // วาดนิ้วชี้
      if (fx) {
        ctx.beginPath();
        ctx.arc(fx, fy, 14, 0, 2 * Math.PI);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestAnimationFrame(loop);
    };

    setup();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);
  const spawnBall = () => {
    const speed = 2 + Math.random() * 2;
    const angle = Math.random() * 2 * Math.PI;
    ballRef.current = {
      x: 80 + Math.random() * (W - 160),
      y: 80 + Math.random() * (H - 160),
      r: 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      trail: [],
      followTime: 0,
      needed: 60
    };
  };
  const startGame = (selectedMode) => {
    modeRef.current = selectedMode;
    scoreRef.current = 0;
    missRef.current = 0;
    circlesRef.current = [];
    ballRef.current = null;
    setScore(null);
    setTimeLeft(5);
    setGameState('playing');
    gameStateRef.current = 'playing';

    if (selectedMode === 'tap') {
      setStatus('👆 แตะวงกลมให้ทัน!');
      const spawnInterval = setInterval(() => {
        if (gameStateRef.current !== 'playing') { clearInterval(spawnInterval); return; }
        if (circlesRef.current.length < 3) {
          circlesRef.current.push({
            id: Date.now(), type: 'tap',
            x: 80 + Math.random() * (W - 160),
            y: 80 + Math.random() * (H - 160),
            r: 40, born: Date.now(), life: 2500, hit: false
          });
        }
      }, 800);
    } else {
      setStatus('✋ เอานิ้วตามลูกบอลให้ได้!');
      spawnBall();
    }

    const gameEndChecker = setInterval(() => {
      if (gameStateRef.current !== 'playing') { clearInterval(gameEndChecker); return; }
      if (missRef.current >= 5) {
        clearInterval(gameEndChecker);
        gameStateRef.current = 'done';
        setGameState('done');
        setScore({ hit: scoreRef.current, miss: missRef.current });
        setStatus('เกมจบแล้ว!');
        const h = scoreRef.current, m = missRef.current;
        const total = h + m;
        const ratio = total > 0 ? h / total : 0;
        const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
        const win = h >= 5;
        if (onGameEnd) onGameEnd({ win, stars, level: null });
      }
    }, 100);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-2">🎮 เกมบำบัดมือ</h2>

      <div className="relative w-full" style={{ height: '500px' }}>
         <video ref={videoRef} autoPlay className="w-full h-full rounded-xl object-cover opacity-40" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ pointerEvents: 'none' }} />

        {gameState === 'playing' && (
          <div className="absolute top-2 left-0 right-0 flex justify-between px-4">
            <span className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              ✅ {scoreRef.current}
            </span>
            <span className="bg-black bg-opacity-60 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
              ❤️ {timeLeft}
            </span>
            <span className="bg-black bg-opacity-60 text-red-400 px-3 py-1 rounded-full text-sm">
              ❌ {missRef.current}
            </span>
          </div>
        )}
      </div>

      <p className="text-yellow-400 font-semibold mt-2 mb-2">{status}</p>

      {score !== null && (
        <div className="bg-gray-800 rounded-xl p-4 mb-3">
          <p className="text-5xl font-bold text-green-400">{score.hit}</p>
          <p className="text-lg mt-1">คะแนน</p>
          <p className="text-red-400 mt-1">พลาด {score.miss} ครั้ง</p>
          {score.hit >= 300 && <p className="text-yellow-400 mt-2">🌟 ยอดเยี่ยม!</p>}
          {score.hit >= 100 && score.hit < 300 && <p className="text-blue-400 mt-2">👍 ดีมาก!</p>}
          {score.hit < 100 && <p className="text-red-400 mt-2">💪 ลองใหม่อีกครั้ง!</p>}
        </div>
      )}

      {gameState !== 'playing' && (
        <div className="flex gap-3 justify-center mt-2">
          <button
            onClick={() => startGame('tap')}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold"
          >
            👆 โหมด Tap
          </button>
          <button
            onClick={() => startGame('drag')}
            className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-semibold"
          >
            ✋ โหมด Drag
          </button>
        </div>
      )}
    </div>
  );
}

export default HandGame;