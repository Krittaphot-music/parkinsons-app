import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

function HandCamera({ onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('กำลังโหลด AI...');
  const handLandmarkerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    let stream;
    let isMounted = true;

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
      if (!isMounted || !videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.onloadeddata = () => {
        if (!isMounted) return;
        setStatus('พบกล้องแล้ว — ยกมือขึ้นมา');
        detect();
      };
    };

    const detect = () => {
      if (!handLandmarkerRef.current || !videoRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results = handLandmarkerRef.current.detectForVideo(video, performance.now());

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.landmarks && results.landmarks.length > 0) {
        setStatus('✅ พบมือแล้ว!');
        const landmarks = results.landmarks[0];

        // วาด bounding box
        const xs = landmarks.map(l => l.x * canvas.width);
        const ys = landmarks.map(l => l.y * canvas.height);
        const minX = Math.min(...xs) - 20;
        const minY = Math.min(...ys) - 20;
        const maxX = Math.max(...xs) + 20;
        const maxY = Math.max(...ys) + 20;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        // วาด landmark จุดๆ
        landmarks.forEach(l => {
          ctx.beginPath();
          ctx.arc(l.x * canvas.width, l.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        });

        if (onResult) onResult(landmarks);
      } else {
        setStatus('ไม่พบมือ — ยกมือขึ้นมาหน้ากล้อง');
      }

      animRef.current = requestAnimationFrame(detect);
    };

    setup();

    return () => {
      isMounted = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="relative w-full">
      <video ref={videoRef} autoPlay className="w-full rounded-xl" />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="mt-2 text-center text-yellow-400 font-semibold">{status}</div>
    </div>
  );
}

export default HandCamera;