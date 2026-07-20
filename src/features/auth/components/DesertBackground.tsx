"use client";

import { useEffect, useRef } from "react";

type DustMote = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  opacity: number;
  phase: number;
};

const DUST_COUNT = 90;

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function createDust(width: number, height: number): DustMote[] {
  const groundTop = height * 0.3;
  const groundSpan = Math.max(height - groundTop, 1);

  return Array.from({ length: DUST_COUNT }, (_, index) => {
    const roll = seededRandom(index + 1);
    const band = seededRandom(index + 21);
    // Distribución más pareja; 1 de cada 4 queda un poco más cerca del piso
    const yFactor = index % 4 === 0 ? Math.pow(band, 0.75) : band;
    return {
      x: seededRandom(index + 11) * width,
      y: groundTop + yFactor * groundSpan,
      radius: 0.8 + roll * 2.4,
      speed: 0.22 + seededRandom(index + 31) * 0.45,
      drift: (seededRandom(index + 41) - 0.5) * 0.55,
      opacity: 0.22 + roll * 0.42,
      phase: seededRandom(index + 51) * Math.PI * 2,
    };
  });
}

function dunePath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
) {
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, baseY);
  for (let x = 0; x <= width; x += 8) {
    const y =
      baseY +
      Math.sin(x * frequency + phase) * amplitude +
      Math.sin(x * frequency * 0.45 + phase * 1.3) * amplitude * 0.35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
}

export function DesertBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<DustMote[]>([]);
  const frameRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvasEl = canvas;
    const ctxEl = ctx;

    function paintSky(width: number, height: number) {
      const sky = ctxEl.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#1a1008");
      sky.addColorStop(0.35, "#2d1b0f");
      sky.addColorStop(0.62, "#4b240f");
      sky.addColorStop(0.82, "#6b3d1f");
      sky.addColorStop(1, "#8a5a32");
      ctxEl.fillStyle = sky;
      ctxEl.fillRect(0, 0, width, height);

      const sunX = width * 0.72;
      const sunY = height * 0.38;
      const sun = ctxEl.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.42);
      sun.addColorStop(0, "rgba(232, 196, 140, 0.45)");
      sun.addColorStop(0.35, "rgba(196, 168, 130, 0.22)");
      sun.addColorStop(0.7, "rgba(75, 36, 15, 0.08)");
      sun.addColorStop(1, "rgba(26, 16, 8, 0)");
      ctxEl.fillStyle = sun;
      ctxEl.fillRect(0, 0, width, height);

      const heat = ctxEl.createRadialGradient(
        width * 0.5,
        height * 0.72,
        0,
        width * 0.5,
        height * 0.72,
        width * 0.7,
      );
      heat.addColorStop(0, "rgba(240, 234, 218, 0.08)");
      heat.addColorStop(1, "rgba(26, 16, 8, 0)");
      ctxEl.fillStyle = heat;
      ctxEl.fillRect(0, 0, width, height);
    }

    function paintDunes(width: number, height: number, phase: number) {
      const layers = [
        { base: 0.58, amp: 28, freq: 0.0045, color: "rgba(67, 47, 35, 0.55)", speed: 0.12 },
        { base: 0.68, amp: 36, freq: 0.0058, color: "rgba(61, 40, 23, 0.72)", speed: 0.2 },
        { base: 0.78, amp: 42, freq: 0.0072, color: "rgba(45, 27, 15, 0.88)", speed: 0.32 },
        { base: 0.88, amp: 22, freq: 0.009, color: "#1a1008", speed: 0.45 },
      ];

      for (const layer of layers) {
        dunePath(
          ctxEl,
          width,
          height,
          height * layer.base,
          layer.amp,
          layer.freq,
          phase * layer.speed,
        );
        ctxEl.fillStyle = layer.color;
        ctxEl.fill();
      }
    }

    function paintDust(width: number, height: number, time: number) {
      const groundTop = height * 0.3;

      for (const mote of dustRef.current) {
        if (!reducedMotion) {
          mote.x += mote.speed + Math.sin(time * 0.0008 + mote.phase) * mote.drift;
          mote.y += Math.sin(time * 0.0012 + mote.phase) * 0.28;
          if (mote.x > width + 10) mote.x = -10;
          if (mote.x < -10) mote.x = width + 10;
          // Mantener el polvo a ras de piso (mitad inferior)
          if (mote.y < groundTop) mote.y = height + 10;
          if (mote.y > height + 10) mote.y = groundTop + 2;
        }

        const pulse = reducedMotion
          ? 1
          : 0.75 + Math.sin(time * 0.001 + mote.phase) * 0.25;
        ctxEl.beginPath();
        ctxEl.fillStyle = `rgba(236, 233, 216, ${mote.opacity * pulse})`;
        ctxEl.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
        ctxEl.fill();
      }
    }

    function getSize() {
      const parent = canvasEl.parentElement;
      const width = Math.max(
        parent?.clientWidth ?? 0,
        window.innerWidth,
        1,
      );
      const height = Math.max(
        parent?.clientHeight ?? 0,
        window.innerHeight,
        1,
      );
      return { width, height };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = getSize();
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
      dustRef.current = createDust(width, height);
    }

    function render(time: number) {
      const { width, height } = getSize();
      if (!reducedMotion) {
        phaseRef.current += 0.004;
      }
      paintSky(width, height);
      paintDunes(width, height, phaseRef.current);
      paintDust(width, height, time);
      frameRef.current = window.requestAnimationFrame(render);
    }

    resize();
    frameRef.current = window.requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(resize);
    if (canvasEl.parentElement) {
      resizeObserver.observe(canvasEl.parentElement);
    }
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="desert-canvas" aria-hidden />;
}
