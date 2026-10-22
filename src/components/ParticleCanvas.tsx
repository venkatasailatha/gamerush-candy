import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CandyColor } from '../types/game';

export interface ParticleCanvasHandle {
  burst: (x: number, y: number, color?: CandyColor | string, count?: number) => void;
  stripedBeam: (startX: number, startY: number, endX: number, endY: number, color: string) => void;
  shockwave: (x: number, y: number, radius?: number, color?: string) => void;
  confettiRain: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'square' | 'star';
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface Beam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  alpha: number;
}

const COLOR_MAP: Record<CandyColor | string, string> = {
  red: '#F43F5E',
  orange: '#FB923C',
  yellow: '#FACC15',
  green: '#22C55E',
  blue: '#38BDF8',
  purple: '#A855F7',
  gold: '#FBBF24',
  rainbow: '#EC4899',
};

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, { width?: number; height?: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);
    const beamsRef = useRef<Beam[]>([]);

    useImperativeHandle(ref, () => ({
      burst: (x: number, y: number, color = 'gold', count = 14) => {
        const hex = COLOR_MAP[color] || color;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
          const speed = Math.random() * 5 + 3;
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            size: Math.random() * 6 + 4,
            color: hex,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.2,
            shape: Math.random() > 0.4 ? 'circle' : 'star',
          });
        }
      },

      stripedBeam: (x1: number, y1: number, x2: number, y2: number, color: string) => {
        beamsRef.current.push({
          x1,
          y1,
          x2,
          y2,
          color: COLOR_MAP[color] || color,
          width: 14,
          alpha: 1,
        });
      },

      shockwave: (x: number, y: number, maxRadius = 120, color = '#FDE047') => {
        shockwavesRef.current.push({
          x,
          y,
          radius: 10,
          maxRadius,
          color,
          alpha: 1,
        });
      },

      confettiRain: () => {
        const palette = ['#F43F5E', '#38BDF8', '#FACC15', '#22C55E', '#A855F7', '#FB923C'];
        const canvas = canvasRef.current;
        if (!canvas) return;

        for (let i = 0; i < 90; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 80,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 4 + 3,
            size: Math.random() * 8 + 6,
            color: palette[Math.floor(Math.random() * palette.length)],
            alpha: 1,
            decay: 0.005,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.15,
            shape: 'square',
          });
        }
      },
    }));

    useEffect(() => {
      let animId: number;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const updateAndRender = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw and update beams
        for (let i = beamsRef.current.length - 1; i >= 0; i--) {
          const b = beamsRef.current[i];
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(b.x1, b.y1);
          ctx.lineTo(b.x2, b.y2);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = b.width;
          ctx.globalAlpha = b.alpha;
          ctx.lineCap = 'round';
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.restore();

          b.width *= 1.1;
          b.alpha -= 0.08;
          if (b.alpha <= 0) {
            beamsRef.current.splice(i, 1);
          }
        }

        // 2. Draw and update shockwaves
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          ctx.save();
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = 6 * sw.alpha;
          ctx.globalAlpha = sw.alpha;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 20;
          ctx.stroke();
          ctx.restore();

          sw.radius += (sw.maxRadius - sw.radius) * 0.2 + 2;
          sw.alpha -= 0.045;
          if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
            shockwavesRef.current.splice(i, 1);
          }
        }

        // 3. Draw and update particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'star') {
            // Draw 4-point star
            ctx.beginPath();
            const s = p.size;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fill();
          } else {
            // Square / ribbon confetti
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          }
          ctx.restore();

          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gentle gravity
          p.rotation += p.vRot;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > canvas.height + 50) {
            particlesRef.current.splice(i, 1);
          }
        }

        animId = requestAnimationFrame(updateAndRender);
      };

      animId = requestAnimationFrame(updateAndRender);

      return () => {
        cancelAnimationFrame(animId);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={width || 600}
        height={height || 600}
        className="absolute inset-0 pointer-events-none z-30"
      />
    );
  }
);

ParticleCanvas.displayName = 'ParticleCanvas';
