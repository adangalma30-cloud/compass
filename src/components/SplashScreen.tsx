/**
 * SplashScreen
 *
 * Full-screen branded loading experience for Compass.
 * Plays once per browser session (gated via sessionStorage).
 *
 * Animation sequence (~2.1 s):
 *  0.2 s  → outer ring draws itself
 *  0.8 s  → radar pulses begin expanding
 *  0.9 s  → needle starts spinning
 *  1.0 s  → location dots materialise (staggered)
 *  1.4 s  → "Compass" + tagline fade in
 *  1.5 s  → loading messages start cycling every 700 ms
 *  2.7 s  → needle locks to North with spring ease
 *  2.1 s  → splash fades out, onComplete fires
 */

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

// ─── Constants ────────────────────────────────────────────

const MESSAGES = [
  "Initializing Compass...",
  "Discovering nearby places...",
  "Preparing your experience...",
  "Ready.",
] as const;

const MESSAGE_INTERVAL_MS = 520;
const TOTAL_DURATION_MS   = 2100;
const FADE_OUT_DURATION_S = 0.42;

// SVG viewBox is 300 × 300; compass centre is (150, 150).
const CX = 150;
const CY = 150;
const RING_R = 78; // outer ring radius

/** Convert polar angle (°, North-up) + distance → SVG {cx, cy}. */
function polar(angleDeg: number, dist: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { cx: CX + dist * Math.cos(rad), cy: CY + dist * Math.sin(rad) };
}

// Location dots: [angle (°, clockwise from N), radius from centre, reveal delay (s)]
const DOTS: { angle: number; dist: number; delay: number }[] = [
  { angle: -55, dist: 118, delay: 0.00 },
  { angle:  25, dist: 112, delay: 0.15 },
  { angle: 100, dist: 122, delay: 0.28 },
  { angle: 195, dist: 116, delay: 0.10 },
  { angle: 300, dist: 120, delay: 0.22 },
];

// Cardinal tick positions [angle °, longer = true for North]
const TICKS = [0, 90, 180, 270];

// ─── Types ────────────────────────────────────────────────

type Props = { onComplete: () => void };

// ─── Component ────────────────────────────────────────────

export default function SplashScreen({ onComplete }: Props) {
  const shouldReduce = useReducedMotion();
  const [msgIndex, setMsgIndex]   = useState(0);
  const [visible, setVisible]     = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  // Respect prefers-reduced-motion — skip splash entirely.
  useEffect(() => {
    if (shouldReduce) onComplete();
  }, [shouldReduce, onComplete]);

  // Cycle loading messages, then schedule fade-out.
  useEffect(() => {
    if (shouldReduce) return;

    intervalRef.current = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev < MESSAGES.length - 1) return prev + 1;
        if (intervalRef.current) clearInterval(intervalRef.current);
        return prev;
      });
    }, MESSAGE_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => setVisible(false), TOTAL_DURATION_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    };
  }, [shouldReduce]);

  if (shouldReduce) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
           style={{ backgroundColor: "#07132f" }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_OUT_DURATION_S, ease: "easeInOut" }}
          aria-label="Loading Compass"
          aria-live="polite"
        >
          {/* ── Compass SVG ─────────────────────────────── */}
           <div className="relative max-w-[72vw]" style={{ width: 300, height: 300 }}>
            <svg
              viewBox="0 0 300 300"
              width={300}
              height={300}
              overflow="visible"
            >
              <defs>
                {/* Soft glow for ring + needle tip */}
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Stronger glow for North needle */}
                <filter id="needle-glow" x="-40%" y="-20%" width="180%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Dot glow */}
                <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Radar pulses (3 staggered rings) ─────── */}
              {[0, 0.8, 1.6].map((delay, i) => (
                <motion.circle
                  key={`pulse-${i}`}
                  cx={CX} cy={CY} r={RING_R}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={1.2 - i * 0.2}
                  style={{ transformOrigin: `${CX}px ${CY}px` }}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: [1, 2.6, 2.6], opacity: [0, 0.35, 0] }}
                  transition={{
                    delay: 0.8 + delay,
                    duration: 2.4,
                    times: [0, 0.85, 1],
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* ── Outer ring (draws itself via pathLength) ─ */}
              <motion.circle
                cx={CX} cy={CY} r={RING_R}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                filter="url(#glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 0.9, delay: 0.2, ease: "easeInOut" },
                  opacity:    { duration: 0.3, delay: 0.2 },
                }}
              />

              {/* ── Inner dashed decorative ring ──────────── */}
              <motion.circle
                cx={CX} cy={CY} r={66}
                fill="none"
                stroke="#6366f1"
                strokeWidth={0.5}
                strokeDasharray="3 10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              />

              {/* ── Cardinal tick marks ────────────────────── */}
              {TICKS.map((angleDeg, i) => {
                const isNorth  = i === 0;
                const outerPt  = polar(angleDeg, RING_R);
                const innerPt  = polar(angleDeg, RING_R - (isNorth ? 9 : 5));
                return (
                  <motion.line
                    key={`tick-${angleDeg}`}
                    x1={outerPt.cx} y1={outerPt.cy}
                    x2={innerPt.cx} y2={innerPt.cy}
                    stroke="#6366f1"
                    strokeWidth={isNorth ? 2 : 1}
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isNorth ? 1 : 0.45 }}
                    transition={{ delay: 1.0, duration: 0.4 }}
                  />
                );
              })}

              {/* ── Location dots (materialise staggered) ─── */}
              {DOTS.map((dot, i) => {
                const { cx, cy } = polar(dot.angle, dot.dist);
                return (
                  <motion.circle
                    key={`dot-${i}`}
                    cx={cx} cy={cy} r={3.5}
                    fill="#6366f1"
                    filter="url(#dot-glow)"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.75] }}
                    transition={{
                      delay: 1.0 + dot.delay,
                      duration: 0.5,
                      times: [0, 0.6, 1],
                      ease: "easeOut",
                    }}
                  />
                );
              })}

              {/* ── Compass needle ──────────────────────────
                  Spins ~360° then locks to North (0°) with
                  a spring overshoot for a satisfying settle.
               ─────────────────────────────────────────── */}
              <motion.g
                style={{ transformOrigin: `${CX}px ${CY}px` }}
                initial={{ rotate: -130 }}
                animate={{ rotate: [null, 220, 0] }}
                transition={{
                  delay: 0.9,
                  duration: 1.9,
                  times: [0, 0.62, 1],
                  // linear spin → spring lock
                  ease: ["linear", [0.34, 1.45, 0.64, 1]],
                }}
              >
                {/* North needle (white → glows) */}
                <polygon
                  points={`${CX},${CY - 60} ${CX - 5},${CY + 2} ${CX + 5},${CY + 2}`}
                  fill="white"
                  filter="url(#needle-glow)"
                />
                {/* South needle (red, no glow) */}
                <polygon
                  points={`${CX},${CY + 60} ${CX - 5},${CY - 2} ${CX + 5},${CY - 2}`}
                  fill="#ef4444"
                  opacity={0.85}
                />
                {/* Centre cap ring */}
                <circle cx={CX} cy={CY} r={6} fill="#6366f1" filter="url(#glow)" />
                <circle cx={CX} cy={CY} r={3} fill="white" />
              </motion.g>
            </svg>
          </div>

          {/* ── Text block ────────────────────────────────── */}
          <motion.div
            className="text-center mt-8 px-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
          >
            {/* Wordmark */}
             <p
               className="text-4xl font-extrabold tracking-tight"
              style={{ color: "#FFFFFF" }}
            >
              Compass
            </p>

            {/* Tagline */}
            <p
              className="text-sm font-medium mt-2"
              style={{ color: "#818cf8" }}
            >
              Find what matters nearby.
            </p>

            {/* Cycling loading messages */}
            <div className="mt-6 h-5">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  className="text-xs"
                  style={{ color: "#475569" }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {MESSAGES[msgIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
