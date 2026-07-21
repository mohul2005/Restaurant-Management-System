import { useMemo } from 'react';

interface SmokeParticle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

function generateParticles(count: number): SmokeParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 2 + ((i * 9) % 96),
    size: 40 + ((i * 7) % 80),
    duration: 4 + ((i * 3) % 6),
    delay: ((i * 2.3) % 8),
    drift: ((i % 2 === 0) ? 1 : -1) * (15 + ((i * 3) % 30)),
    opacity: 0.04 + ((i * 1.1) % 8) * 0.008,
  }));
}

export default function KitchenSmoke() {
  const particles = useMemo(() => generateParticles(16), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes smoke-rise-1 {
          0% {
            transform: translateY(0) translateX(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: var(--smoke-opacity);
          }
          40% {
            transform: translateY(-120px) translateX(var(--smoke-drift)) scale(1.2);
            opacity: var(--smoke-opacity);
          }
          80% {
            transform: translateY(-320px) translateX(calc(var(--smoke-drift) * 2.2)) scale(1.8);
            opacity: calc(var(--smoke-opacity) * 0.5);
          }
          100% {
            transform: translateY(-520px) translateX(calc(var(--smoke-drift) * 3.5)) scale(2.4);
            opacity: 0;
          }
        }
        @keyframes smoke-rise-2 {
          0% {
            transform: translateY(0) translateX(0) scale(0.5);
            opacity: 0;
          }
          12% {
            opacity: var(--smoke-opacity);
          }
          35% {
            transform: translateY(-100px) translateX(var(--smoke-drift)) scale(1);
            opacity: var(--smoke-opacity);
          }
          70% {
            transform: translateY(-280px) translateX(calc(var(--smoke-drift) * 2.6)) scale(1.6);
            opacity: calc(var(--smoke-opacity) * 0.45);
          }
          100% {
            transform: translateY(-460px) translateX(calc(var(--smoke-drift) * 4)) scale(2.2);
            opacity: 0;
          }
        }
        @keyframes smoke-rise-3 {
          0% {
            transform: translateY(0) translateX(0) scale(0.7);
            opacity: 0;
          }
          18% {
            opacity: var(--smoke-opacity);
          }
          45% {
            transform: translateY(-140px) translateX(var(--smoke-drift)) scale(1.3);
            opacity: calc(var(--smoke-opacity) * 0.9);
          }
          85% {
            transform: translateY(-360px) translateX(calc(var(--smoke-drift) * 2)) scale(2);
            opacity: calc(var(--smoke-opacity) * 0.35);
          }
          100% {
            transform: translateY(-560px) translateX(calc(var(--smoke-drift) * 3.2)) scale(2.6);
            opacity: 0;
          }
        }
        @keyframes steam-wobble {
          0%, 100% { border-radius: 60% 40% 55% 45%; }
          25% { border-radius: 45% 55% 40% 60%; }
          50% { border-radius: 55% 45% 60% 40%; }
          75% { border-radius: 40% 60% 45% 55%; }
        }
      `}</style>
      {particles.map((p) => {
        const animName = `smoke-rise-${(p.id % 3) + 1}`;
        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              bottom: '-40px',
              width: `${p.size}px`,
              height: `${p.size * 1.3}px`,
              animation: `${animName} ${p.duration}s ease-out ${p.delay}s infinite, steam-wobble ${p.duration * 1.5}s ease-in-out ${p.delay}s infinite`,
              background: `radial-gradient(ellipse at center, oklch(var(--primary-500) / ${p.opacity * 3}) 0%, oklch(var(--accent-500) / ${p.opacity * 1.5}) 30%, transparent 70%)`,
              filter: 'blur(18px)',
              '--smoke-opacity': p.opacity,
              '--smoke-drift': `${p.drift}px`,
            } as React.CSSProperties}
          />
        );
      })}
      {/* Extra thin wisps for depth */}
      {particles.slice(0, 8).map((p) => {
        const animName = `smoke-rise-${(p.id % 3) + 1}`;
        return (
          <div
            key={`wisp-${p.id}`}
            className="absolute"
            style={{
              left: `${(p.left + 5) % 94}%`,
              bottom: '-50px',
              width: `${p.size * 0.5}px`,
              height: `${p.size * 0.8}px`,
              animation: `${animName} ${p.duration + 2}s ease-out ${p.delay + 1.5}s infinite`,
              background: `radial-gradient(ellipse at center, oklch(var(--primary-500) / ${p.opacity * 2}) 0%, oklch(var(--accent-500) / ${p.opacity}) 40%, transparent 75%)`,
              filter: 'blur(12px)',
              '--smoke-opacity': p.opacity * 0.7,
              '--smoke-drift': `${p.drift * 0.6}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}