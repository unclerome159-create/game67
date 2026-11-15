import { useEffect, useRef } from 'react';
import { ElementId, SkinAppearance } from '../types/game';
import { ELEMENTS } from '../data/gameData';

export interface BattleAnimationEvent {
  id: number;
  type: 'player_attack' | 'player_heal' | 'enemy_attack';
  amount: number;
  element: ElementId;
  multiplier?: number;
}

interface BattleCanvasProps {
  mode: 'pve' | 'pvp';
  playerElement: ElementId;
  enemyElement: ElementId;
  playerAppearance: SkinAppearance;
  playerName: string;
  enemyName: string;
  bossPhase: 1 | 2 | 3;
  lastEvent: BattleAnimationEvent | null;
  bossImageUrl?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

interface FloatingNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export function BattleCanvas({
  mode,
  playerElement,
  enemyElement,
  playerAppearance,
  playerName,
  enemyName,
  bossPhase,
  lastEvent,
  bossImageUrl,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatsRef = useRef<FloatingNumber[]>([]);
  const shakeRef = useRef<{ target: 'player' | 'enemy' | null; frames: number }>({
    target: null,
    frames: 0,
  });
  const lungeRef = useRef<{ target: 'player' | 'enemy' | null; frames: number }>({
    target: null,
    frames: 0,
  });
  const bossImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!bossImageUrl) return;
    const img = new Image();
    img.src = bossImageUrl;
    img.onload = () => {
      bossImgRef.current = img;
    };
  }, [bossImageUrl]);

  useEffect(() => {
    if (!lastEvent) return;
    const accent = ELEMENTS[lastEvent.element].accentHex;
    const isPlayerAct = lastEvent.type === 'player_attack' || lastEvent.type === 'player_heal';

    if (lastEvent.type === 'player_attack') {
      lungeRef.current = { target: 'player', frames: 16 };
      shakeRef.current = { target: 'enemy', frames: 18 };
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
        const speed = 1.8 + Math.random() * 4.5;
        particlesRef.current.push({
          x: 560,
          y: 165,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 3.5,
          alpha: 1,
          color: accent,
        });
      }
      floatsRef.current.push({
        x: 560,
        y: 105,
        text: `-${lastEvent.amount}${lastEvent.multiplier && lastEvent.multiplier > 1 ? ' ×1.5' : ''}`,
        color: '#FBBF24',
        alpha: 1,
        vy: -1.1,
      });
    } else if (lastEvent.type === 'player_heal') {
      for (let i = 0; i < 16; i++) {
        particlesRef.current.push({
          x: 185 + (Math.random() - 0.5) * 60,
          y: 205,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -1.5 - Math.random() * 2,
          radius: 3 + Math.random() * 2.5,
          alpha: 1,
          color: '#10B981',
        });
      }
      floatsRef.current.push({
        x: 185,
        y: 110,
        text: `+${lastEvent.amount} HP`,
        color: '#34D399',
        alpha: 1,
        vy: -1.0,
      });
    } else if (lastEvent.type === 'enemy_attack') {
      lungeRef.current = { target: 'enemy', frames: 16 };
      shakeRef.current = { target: 'player', frames: 18 };
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particlesRef.current.push({
          x: 185,
          y: 165,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 3,
          alpha: 1,
          color: '#EF4444',
        });
      }
      floatsRef.current.push({
        x: 185,
        y: 105,
        text: `-${lastEvent.amount}`,
        color: '#F87171',
        alpha: 1,
        vy: -1.1,
      });
    }

    void isPlayerAct;
  }, [lastEvent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const render = () => {
      tick += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Clear & deep arena slate background
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E293B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural arena grid floor
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        const y = 215 + i * 16;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 10; i++) {
        const xTop = 120 + i * 52;
        const xBot = 40 + i * 68;
        ctx.beginPath();
        ctx.moveTo(xTop, 215);
        ctx.lineTo(xBot, h);
        ctx.stroke();
      }

      // Compute lunge & shake offsets
      let playerOffsetX = 0;
      let playerOffsetY = Math.sin(tick * 1.6) * 4;
      let enemyOffsetX = 0;
      let enemyOffsetY = Math.sin(tick * 1.3 + 1) * 5;

      if (lungeRef.current.frames > 0) {
        const progress = Math.sin((lungeRef.current.frames / 16) * Math.PI);
        if (lungeRef.current.target === 'player') playerOffsetX += progress * 36;
        if (lungeRef.current.target === 'enemy') enemyOffsetX -= progress * 36;
        lungeRef.current.frames -= 1;
      }

      if (shakeRef.current.frames > 0) {
        const jx = (Math.random() - 0.5) * 9;
        if (shakeRef.current.target === 'player') playerOffsetX += jx;
        if (shakeRef.current.target === 'enemy') enemyOffsetX += jx;
        shakeRef.current.frames -= 1;
      }

      const playerAccent = ELEMENTS[playerElement].accentHex;
      const enemyAccent = ELEMENTS[enemyElement].accentHex;

      // Player pedestal & sigil
      const px = 185 + playerOffsetX;
      const py = 170 + playerOffsetY;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(185, 245, 62, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
      ctx.fill();
      ctx.strokeStyle = playerAccent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Player stylized sprite
      ctx.fillStyle = playerAppearance.outfitColor;
      ctx.beginPath();
      ctx.roundRect(px - 28, py - 10, 56, 62, 14);
      ctx.fill();

      // Player head
      ctx.fillStyle = playerAppearance.skinTone;
      ctx.beginPath();
      ctx.arc(px, py - 28, 22, 0, Math.PI * 2);
      ctx.fill();

      // Player hair cap
      ctx.fillStyle = playerAppearance.hairColor;
      ctx.beginPath();
      ctx.arc(px, py - 33, 22, Math.PI, Math.PI * 2);
      ctx.fill();

      // Player weapon / focus orb
      ctx.fillStyle = playerAccent;
      ctx.beginPath();
      ctx.arc(px + 42, py + 4 + Math.sin(tick * 2.5) * 4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Player label beneath pedestal
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 13px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(playerName, 185, 282);
      ctx.restore();

      // Enemy pedestal & sprite
      const ex = 560 + enemyOffsetX;
      const ey = 165 + enemyOffsetY;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(560, 245, 76, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.18)';
      ctx.fill();
      ctx.strokeStyle = enemyAccent;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (mode === 'pve') {
        // Rotating astrolabe rings behind boss
        ctx.save();
        ctx.translate(ex, ey - 8);
        ctx.rotate(tick * (0.4 + bossPhase * 0.25));
        ctx.strokeStyle = bossPhase >= 2 ? '#F59E0B' : 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (bossImgRef.current) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ex, ey - 8, 52, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(bossImgRef.current, ex - 52, ey - 60, 104, 104);
          ctx.restore();
          ctx.strokeStyle = enemyAccent;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ex, ey - 8, 52, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(ex, ey - 8, 46, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // PvP Opponent figure
        ctx.fillStyle = '#0F766E';
        ctx.beginPath();
        ctx.roundRect(ex - 28, ey - 5, 56, 62, 14);
        ctx.fill();
        ctx.fillStyle = '#F3D2B3';
        ctx.beginPath();
        ctx.arc(ex, ey - 23, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(ex, ey - 28, 22, Math.PI, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 13px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(enemyName, 560, 282);
      ctx.restore();

      // Update & draw particles
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.04);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.93;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & draw floating numbers
      floatsRef.current = floatsRef.current.filter((f) => f.alpha > 0.05);
      for (const f of floatsRef.current) {
        f.y += f.vy;
        f.alpha *= 0.96;
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    mode,
    playerElement,
    enemyElement,
    playerAppearance,
    playerName,
    enemyName,
    bossPhase,
  ]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={760}
        height={310}
        className="block h-auto w-full"
        aria-label="Игровая арена пошагового боя"
      />
    </div>
  );
}
