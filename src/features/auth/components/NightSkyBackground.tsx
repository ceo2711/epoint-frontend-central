"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  highlight: number;
};

const STAR_COUNT = 340;
const LINK_RADIUS = 280;
const LINK_DISTANCE = 130;
const HIGHLIGHT_EASE = 0.18;

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function createStars(width: number, height: number): Star[] {
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const roll = seededRandom(index + 1);
    const sizeRoll = seededRandom(index + 101);
    return {
      x: seededRandom(index + 201) * width,
      y: seededRandom(index + 301) * height,
      radius: sizeRoll > 0.96 ? 2.4 : sizeRoll > 0.88 ? 1.6 : 0.7 + roll * 0.9,
      baseOpacity: 0.35 + roll * 0.6,
      twinkleSpeed: 0.3 + seededRandom(index + 401) * 1.1,
      twinkleOffset: seededRandom(index + 501) * Math.PI * 2,
      highlight: 0,
    };
  });
}

export function NightSkyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvasEl = canvas;
    const ctxEl = ctx;

    function paintSky(width: number, height: number) {
      const gradient = ctxEl.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#01030a");
      gradient.addColorStop(0.45, "#020617");
      gradient.addColorStop(1, "#030712");
      ctxEl.fillStyle = gradient;
      ctxEl.fillRect(0, 0, width, height);

      const haze = ctxEl.createRadialGradient(
        width * 0.5,
        height * 0.15,
        0,
        width * 0.5,
        height * 0.15,
        width * 0.75,
      );
      haze.addColorStop(0, "rgba(15, 23, 42, 0.35)");
      haze.addColorStop(1, "rgba(1, 3, 10, 0)");
      ctxEl.fillStyle = haze;
      ctxEl.fillRect(0, 0, width, height);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvasEl.getBoundingClientRect();
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(width, height);
    }

    function updatePointer(clientX: number, clientY: number) {
      const rect = canvasEl.getBoundingClientRect();
      mouseRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
        active: true,
      };
    }

    function drawConstellationLinks(mouse: { x: number; y: number }) {
      const stars = starsRef.current;
      const nearby: { star: Star; index: number }[] = [];

      for (let index = 0; index < stars.length; index += 1) {
        const star = stars[index];
        if (star.highlight > 0.12) {
          nearby.push({ star, index });
        }
      }

      for (let i = 0; i < nearby.length; i += 1) {
        for (let j = i + 1; j < nearby.length; j += 1) {
          const a = nearby[i].star;
          const b = nearby[j].star;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > LINK_DISTANCE) continue;

          const linkStrength = Math.min(a.highlight, b.highlight) * (1 - dist / LINK_DISTANCE);
          if (linkStrength < 0.05) continue;

          ctxEl.beginPath();
          ctxEl.strokeStyle = `rgba(186, 210, 255, ${linkStrength * 0.55})`;
          ctxEl.lineWidth = 1.2 + linkStrength * 1.1;
          ctxEl.moveTo(a.x, a.y);
          ctxEl.lineTo(b.x, b.y);
          ctxEl.stroke();
        }
      }
    }

    function drawStars(time: number) {
      const mouse = mouseRef.current;

      for (const star of starsRef.current) {
        let targetHighlight = 0;
        if (mouse.active && !reducedMotion) {
          const dist = Math.hypot(star.x - mouse.x, star.y - mouse.y);
          if (dist < LINK_RADIUS) {
            targetHighlight = 1 - dist / LINK_RADIUS;
            targetHighlight *= targetHighlight;
          }
        }

        star.highlight += (targetHighlight - star.highlight) * HIGHLIGHT_EASE;

        const twinkle = reducedMotion
          ? 1
          : 0.7 + Math.sin(time * 0.0012 * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        const opacity = Math.min(1, star.baseOpacity * twinkle * (1 + star.highlight * 0.65));
        const radius = star.radius * (1 + star.highlight * 0.45);

        if (star.highlight > 0.12 && star.radius > 0.7) {
          ctxEl.beginPath();
          ctxEl.fillStyle = `rgba(186, 210, 255, ${opacity * star.highlight * 0.4})`;
          ctxEl.arc(star.x, star.y, radius * 4.2, 0, Math.PI * 2);
          ctxEl.fill();
        }

        ctxEl.beginPath();
        ctxEl.fillStyle = `rgba(248, 250, 252, ${opacity})`;
        ctxEl.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctxEl.fill();
      }

      if (mouse.active && !reducedMotion) {
        drawConstellationLinks(mouse);
      }
    }

    function render(time: number) {
      const { width, height } = canvasEl.getBoundingClientRect();
      paintSky(width, height);
      drawStars(time);
      frameRef.current = window.requestAnimationFrame(render);
    }

    function onMouseMove(event: MouseEvent) {
      updatePointer(event.clientX, event.clientY);
    }

    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    }

    function onPointerLeave() {
      mouseRef.current.active = false;
    }

    resize();
    frameRef.current = window.requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasEl);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="night-sky-canvas" aria-hidden />;
}
