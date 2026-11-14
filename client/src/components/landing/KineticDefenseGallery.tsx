import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Cylinder,
  Layers,
  Pause,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "../shared/Badge";
import { ScrollReveal } from "../shared/ScrollMotion";

interface DefenseSlide {
  id: string;
  indexLabel: string;
  title: string;
  subsystem: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  image: string;
  alt: string;
  statusTone: "emerald" | "cyan" | "amber" | "rose";
}

const DEFENSE_SLIDES: DefenseSlide[] = [
  {
    id: "core",
    indexLabel: "01",
    title: "Perimeter Inspection Core",
    subsystem: "guard.checkInput() + checkAction()",
    summary:
      "Dual-gate inspection wrapping untrusted inbound payloads and proposed tool calls in two lines of TypeScript.",
    metricLabel: "RULES LATENCY",
    metricValue: "< 2.0 ms",
    image: "/assets/hero-perimeter-core.jpg",
    alt: "Cryptographic perimeter core guarding inbound and outbound AI boundaries",
    statusTone: "emerald",
  },
  {
    id: "topology",
    indexLabel: "02",
    title: "Concealment & Prompt AST",
    subsystem: "Cheerio DOM + Unicode Telemetry",
    summary:
      "Exposes hidden display:none blocks, white-on-white lures, HTML comments, and 14 invisible Unicode controls.",
    metricLabel: "DETECTORS",
    metricValue: "12 Rules + LLM",
    image: "/assets/threat-topology-mesh.jpg",
    alt: "Neural threat topology mesh isolating prompt-injection pathways",
    statusTone: "cyan",
  },
  {
    id: "vault",
    indexLabel: "03",
    title: "Verhoeff Data Shield",
    subsystem: "PII & Secret Egress Barrier",
    summary:
      "Masks Verhoeff-verified Aadhaar numbers, PAN, 16 UPI bank handles, phones, and API keys before persistence.",
    metricLabel: "RAW BYTES SAVED",
    metricValue: "0 Bytes",
    image: "/assets/data-shield-vault.jpg",
    alt: "Data Shield optical prism filtering sensitive Indian PII and API keys",
    statusTone: "rose",
  },
  {
    id: "sandbox",
    indexLabel: "04",
    title: "Human-in-the-Loop Firewall",
    subsystem: "Pending Proposal Queue · 15m TTL",
    summary:
      "Suspends outbound send, forward, and share actions for explicit human approval, redaction, or instant deny.",
    metricLabel: "DEFAULT GATE",
    metricValue: "Fail-Closed",
    image: "/assets/agent-sandbox-perimeter.jpg",
    alt: "Isolated execution sandbox holding agent actions for human approval",
    statusTone: "amber",
  },
  {
    id: "ledger",
    indexLabel: "05",
    title: "Tamper-Evident Audit Chain",
    subsystem: "SHA-256 + pgcrypto Parity",
    summary:
      "Locks every event per tenant with Postgres advisory serialization and canonical JSON chaining for instant proof.",
    metricLabel: "VERIFICATION",
    metricValue: "SHA-256 Seq",
    image: "/assets/audit-ledger-chain.jpg",
    alt: "Cryptographically linked audit chain blocks verifying log immutability",
    statusTone: "emerald",
  },
];

const MARQUEE_TOKENS = [
  "INGRESS :: DOM + UNICODE AST",
  "SHIELD :: VERHOEFF D5 CHECKSUM",
  "EGRESS :: MANDATORY HUMAN GATE",
  "LEDGER :: SHA-256 CANONICAL CHAIN",
  "TENANCY :: SUPABASE RLS ISOLATION",
];

type StageMode = "coverflow" | "rotor";

const TONE_BADGE: Record<DefenseSlide["statusTone"], string> = {
  emerald: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
  cyan: "border-cyan-400/40 bg-cyan-400/15 text-cyan-300",
  amber: "border-amber-400/40 bg-amber-400/15 text-amber-300",
  rose: "border-rose-400/40 bg-rose-400/15 text-rose-300",
};

export function KineticDefenseGallery() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<StageMode>("coverflow");
  const [playing, setPlaying] = useState(!prefersReducedMotion);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [rotorAngle, setRotorAngle] = useState(0);

  // Drag/swipe state (Vynora CoverFlow momentum interaction)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: stageScrollProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const smoothStageScroll = useSpring(stageScrollProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });
  const backdropParallaxY = useTransform(smoothStageScroll, [0, 1], [-22, 22]);
  const backdropScale = useTransform(smoothStageScroll, [0, 0.5, 1], [1.08, 1.18, 1.08]);
  const stageParallaxY = useTransform(smoothStageScroll, [0, 1], [18, -18]);
  const stageScrollTilt = useTransform(smoothStageScroll, [0, 1], [3.5, -3.5]);

  // Responsive viewport measurement
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = viewportWidth < 640;
  const isCompactMobile = viewportWidth < 380;
  const cardWidth = isCompactMobile ? 168 : isMobile ? 204 : viewportWidth < 1024 ? 236 : 268;
  const cardHeight = isCompactMobile ? 198 : isMobile ? 228 : 254;
  const coverflowSpacing = isCompactMobile ? 92 : isMobile ? 114 : 158;
  const cylinderRadius = isCompactMobile ? 132 : isMobile ? 158 : 210;

  const activeSlide = DEFENSE_SLIDES[activeIndex];

  const selectIndex = useCallback(
    (next: number) => {
      const normalized = (next + DEFENSE_SLIDES.length) % DEFENSE_SLIDES.length;
      setActiveIndex(normalized);
      setRotorAngle(-(normalized * (360 / DEFENSE_SLIDES.length)));
    },
    [],
  );

  // Showcase Slider auto-advance cadence in CoverFlow mode
  useEffect(() => {
    if (!playing || prefersReducedMotion || mode !== "coverflow" || isDragging) return;
    const intervalMs = Math.max(1800, Math.round(4200 / Math.max(0.4, speedMultiplier)));
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % DEFENSE_SLIDES.length;
        setRotorAngle(-(next * (360 / DEFENSE_SLIDES.length)));
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [playing, prefersReducedMotion, mode, isDragging, speedMultiplier]);

  // Rotor continuous kinetic cylinder rotation when Orbit mode is active
  useEffect(() => {
    if (!playing || prefersReducedMotion || mode !== "rotor" || isDragging) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      setRotorAngle((prev) => prev - dt * 18 * speedMultiplier);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [playing, prefersReducedMotion, mode, isDragging, speedMultiplier]);

  // Sync activeIndex closest to camera in Rotor mode
  useEffect(() => {
    if (mode !== "rotor") return;
    const step = 360 / DEFENSE_SLIDES.length;
    const normalized = ((-rotorAngle % 360) + 360) % 360;
    const nearest = Math.round(normalized / step) % DEFENSE_SLIDES.length;
    if (nearest !== activeIndex) {
      setActiveIndex(nearest);
    }
  }, [rotorAngle, mode, activeIndex]);

  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    setDragOffset(0);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - dragStartX.current;
    setDragOffset(delta);
    if (mode === "rotor") {
      setRotorAngle((prev) => prev + delta * 0.14);
      dragStartX.current = clientX;
    }
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (mode === "coverflow") {
      if (Math.abs(dragOffset) > 42) {
        if (dragOffset < 0) {
          selectIndex(activeIndex + 1);
        } else {
          selectIndex(activeIndex - 1);
        }
      }
    }
    setDragOffset(0);
  };

  const getCoverFlowTransform = (index: number) => {
    let diff = index - activeIndex;
    // Shortest circular wrap distance for continuous feel
    if (diff > DEFENSE_SLIDES.length / 2) diff -= DEFENSE_SLIDES.length;
    if (diff < -DEFENSE_SLIDES.length / 2) diff += DEFENSE_SLIDES.length;

    const dragShift = isDragging ? Math.max(-1.2, Math.min(1.2, dragOffset / 130)) : 0;
    const offset = diff + dragShift;
    const absOffset = Math.abs(offset);

    if (absOffset < 0.12) {
      return {
        transform: `translate3d(0px, -6px, 95px) rotateY(0deg) scale(1.08)`,
        zIndex: 40,
        opacity: 1,
      };
    }

    const direction = offset < 0 ? -1 : 1;
    const x = direction * coverflowSpacing * absOffset;
    const z = -75 * absOffset;
    const rotateY = -direction * Math.min(54, 34 + absOffset * 12);
    const scale = Math.max(0.74, 0.96 - absOffset * 0.09);

    return {
      transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex: Math.max(5, 35 - Math.round(absOffset * 8)),
      opacity: Math.max(0.45, 1 - absOffset * 0.2),
    };
  };

  const marqueeDuration = useMemo(() => `${Math.max(10, Math.round(28 / Math.max(0.4, speedMultiplier)))}s`, [speedMultiplier]);

  const effectiveAngleDeg = (((Math.round(-rotorAngle) % 360) + 360) % 360);

  return (
    <section
      aria-labelledby="defense-gallery-heading"
      className="border-b border-hairline py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Badge tone="telemetry">Interactive Spatial Security Tour</Badge>
            <h2
              id="defense-gallery-heading"
              className="mt-3 font-display text-fluid-h2 font-bold tracking-tight text-ink"
            >
              Inspect every perimeter boundary in motion
            </h2>
            <p className="mt-2.5 text-sm text-ink-muted sm:text-base">
              Drag, tap any thumbnail, or use arrow keys to orbit through Agent Guard&apos;s five
              enforcement layers—from deterministic DOM inspection to immutable hashing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Gallery projection mode"
              className="inline-flex rounded-xl border border-hairline bg-surface p-1"
            >
              <button
                type="button"
                onClick={() => {
                  setMode("coverflow");
                  selectIndex(activeIndex);
                }}
                aria-pressed={mode === "coverflow"}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                  mode === "coverflow"
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                3D CoverFlow
              </button>
              <button
                type="button"
                onClick={() => setMode("rotor")}
                aria-pressed={mode === "rotor"}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                  mode === "rotor"
                    ? "bg-telemetry/15 text-telemetry"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Cylinder className="h-3.5 w-3.5" aria-hidden="true" />
                Rotor Orbit
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Enclosed High-Contrast Obsidian Stage */}
        <ScrollReveal delay={0.08}>
          <div
            ref={stageRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Agent Guard five defense layers"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                selectIndex(activeIndex - 1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                selectIndex(activeIndex + 1);
              }
            }}
            className="relative mt-8 overflow-hidden rounded-3xl border border-hairline-bright bg-slate-950 text-slate-50 shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {/* Showcase-style Full-Bleed Ambient Crossfade + Scroll Parallax Backdrop */}
            <motion.div
              aria-hidden="true"
              style={
                prefersReducedMotion
                  ? undefined
                  : { y: backdropParallaxY, scale: backdropScale }
              }
              className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform"
            >
              {DEFENSE_SLIDES.map((slide, idx) => (
                <motion.div
                  key={slide.id}
                  className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
                  style={{ backgroundImage: `url('${slide.image}')` }}
                  animate={{ opacity: idx === activeIndex ? 0.36 : 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 1.4,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/45 to-slate-950/95" />
            </motion.div>

          {/* Vynora-inspired Perspective Reflective Floor Plane */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-75"
            style={{
              background:
                "linear-gradient(to top, rgba(16, 240, 160, 0.05) 0%, rgba(255,255,255,0.025) 45%, transparent 100%)",
              transform: "perspective(1000px) rotateX(60deg)",
              transformOrigin: "bottom center",
            }}
          />

          {/* Top Bar: Rotor Kinetic Telemetry Marquee Strip + Floating Controls */}
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="ag-marquee-group min-w-0 flex-1 overflow-hidden">
              <div
                className="ag-marquee-track items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-emerald-300/80"
                style={{ "--ag-marquee-duration": marqueeDuration } as React.CSSProperties}
              >
                {[...MARQUEE_TOKENS, ...MARQUEE_TOKENS].map((token, idx) => (
                  <span key={idx} className="inline-flex shrink-0 items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                    {token}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause showcase motion" : "Play showcase motion"}
                aria-pressed={playing}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-100 backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-emerald-400/50 hover:text-emerald-300 active:scale-95"
              >
                {playing ? (
                  <Pause className="ag-icon-pop h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="ag-icon-pop h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setControlsOpen((o) => !o)}
                aria-expanded={controlsOpen}
                aria-label="Toggle kinetic speed controls"
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-medium backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${
                  controlsOpen
                    ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-200"
                    : "border-white/15 bg-white/10 text-slate-100 hover:border-white/30"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Controls</span>
              </button>

              {controlsOpen && (
                <div className="ag-glass-dock absolute right-0 top-full z-40 mt-2.5 w-64 rounded-2xl border border-white/15 p-4 text-left">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                    <span>Kinetic Cadence</span>
                    <span className="font-mono text-cyan-300">{speedMultiplier.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.4}
                    step={0.2}
                    value={speedMultiplier}
                    onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                    aria-label="Kinetic carousel and marquee speed multiplier"
                    className="mt-2.5 h-2 w-full cursor-pointer accent-emerald-400"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px] text-slate-300">
                    <span>Projection: {mode === "coverflow" ? "CoverFlow" : "Rotor 3D"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeedMultiplier(1);
                        selectIndex(0);
                      }}
                      className="font-mono text-emerald-300 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3D Interactive Stage */}
          <div
            className="relative z-20 flex min-h-[340px] items-center justify-center px-3 pb-6 pt-8 select-none sm:min-h-[410px] sm:px-8"
            style={{
              perspective: "1400px",
              perspectiveOrigin: "50% 45%",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseMove={(e) => handlePointerMove(e.clientX)}
            onMouseUp={handlePointerEnd}
            onMouseLeave={handlePointerEnd}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
            onTouchEnd={handlePointerEnd}
          >
            {/* Left / Right Nav Triggers */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectIndex(activeIndex - 1);
              }}
              aria-label="Previous security layer"
              className="ag-glass-dock absolute left-2 z-50 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 text-slate-100 transition-transform duration-200 hover:scale-110 hover:border-emerald-400/50 hover:text-emerald-300 active:scale-95 sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectIndex(activeIndex + 1);
              }}
              aria-label="Next security layer"
              className="ag-glass-dock absolute right-2 z-50 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 text-slate-100 transition-transform duration-200 hover:scale-110 hover:border-emerald-400/50 hover:text-emerald-300 active:scale-95 sm:right-5"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Stage Cards Container wrapped in smooth scroll-linked 3D parallax camera */}
            <motion.div
              style={
                prefersReducedMotion
                  ? { transformStyle: "preserve-3d" }
                  : {
                      y: stageParallaxY,
                      rotateX: stageScrollTilt,
                      transformStyle: "preserve-3d",
                    }
              }
              className="will-change-transform"
            >
            {mode === "coverflow" ? (
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transformStyle: "preserve-3d",
                }}
              >
                {DEFENSE_SLIDES.map((slide, idx) => {
                  const styleState = getCoverFlowTransform(idx);
                  const isCenter = idx === activeIndex;
                  return (
                    <div
                      key={slide.id}
                      onClick={() => !isDragging && selectIndex(idx)}
                      style={{
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        transform: styleState.transform,
                        zIndex: styleState.zIndex,
                        opacity: styleState.opacity,
                        transformStyle: "preserve-3d",
                        transition: isDragging
                          ? "none"
                          : prefersReducedMotion
                            ? "none"
                            : "all 520ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className="group absolute cursor-pointer rounded-2xl will-change-transform"
                    >
                      <DefenseCardSurface slide={slide} active={isCenter} prefersReducedMotion={prefersReducedMotion} />

                      {/* Vynora-signature Mirror Reflection Floor Card */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-full mt-2 h-24 w-full overflow-hidden rounded-2xl"
                        style={{
                          transform: "scaleY(-1)",
                          opacity: isCenter ? 0.36 : 0.18,
                          maskImage:
                            "linear-gradient(to top, rgba(255,255,255,0.85) 0%, transparent 72%)",
                          WebkitMaskImage:
                            "linear-gradient(to top, rgba(255,255,255,0.85) 0%, transparent 72%)",
                        }}
                      >
                        <img
                          src={slide.image}
                          alt=""
                          width={1376}
                          height={768}
                          loading="lazy"
                          className="h-full w-full object-cover blur-[1px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Rotor 3D Cylindrical Gallery Projection */
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transformStyle: "preserve-3d",
                  transform: `rotateX(-6deg) rotateY(${rotorAngle}deg)`,
                  transition:
                    playing || isDragging || prefersReducedMotion
                      ? "none"
                      : "transform 480ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                {DEFENSE_SLIDES.map((slide, idx) => {
                  const angle = idx * (360 / DEFENSE_SLIDES.length);
                  const isCenter = idx === activeIndex;
                  return (
                    <div
                      key={slide.id}
                      onClick={() => selectIndex(idx)}
                      style={{
                        width: `${cardWidth - 16}px`,
                        height: `${cardHeight - 16}px`,
                        transform: `rotateY(${angle}deg) translateZ(${cylinderRadius}px)`,
                        backfaceVisibility: "visible",
                      }}
                      className="group absolute cursor-pointer rounded-2xl"
                    >
                      <DefenseCardSurface slide={slide} active={isCenter} prefersReducedMotion={prefersReducedMotion} />
                    </div>
                  );
                })}
              </div>
            )}
            </motion.div>
          </div>

          {/* Bottom Deck: Active Defense Telemetry Readout + Showcase Morphing Thumbnail Dock + Rotor CAM HUD */}
          <div className="relative z-30 border-t border-white/10 bg-slate-950/65 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="grid items-center gap-4 lg:grid-cols-12">
              {/* Left: Rotor-style CAM / Telemetry Coordinate Overlay */}
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 lg:col-span-3 lg:block">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      playing ? "animate-pulse bg-emerald-400" : "bg-rose-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                    Stage Vector Telemetry
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono">
                  <div>
                    <p className="text-[10px] text-slate-400">LAYER</p>
                    <p className="text-xs font-semibold text-slate-100">
                      #{activeSlide.indexLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">ORBIT θ</p>
                    <p className="text-xs font-semibold text-cyan-300">{effectiveAngleDeg}°</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">CADENCE</p>
                    <p className="text-xs font-semibold text-emerald-300">
                      {speedMultiplier.toFixed(1)}×
                    </p>
                  </div>
                </div>
              </div>

              {/* Center: Active Slide Details with smooth glide crossfade */}
              <div className="min-w-0 text-center lg:col-span-5 lg:text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${TONE_BADGE[activeSlide.statusTone]}`}
                      >
                        {activeSlide.indexLabel} · {activeSlide.subsystem}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {activeSlide.metricLabel}:{" "}
                        <strong className="text-slate-100">{activeSlide.metricValue}</strong>
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-50">
                      {activeSlide.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-300">
                      {activeSlide.summary}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right / Bottom Center: Showcase Slider Morphing Frosted Thumbnail Dock */}
              <div className="flex justify-center lg:col-span-4 lg:justify-end">
                <div
                  role="tablist"
                  aria-label="Select defense layer thumbnail"
                  className="ag-glass-dock inline-flex max-w-full items-center gap-1.5 rounded-2xl border border-white/15 p-2 sm:gap-2"
                >
                  {DEFENSE_SLIDES.map((slide, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <motion.button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`${slide.indexLabel} ${slide.title}`}
                        onClick={() => selectIndex(idx)}
                        animate={{
                          width: prefersReducedMotion
                            ? isActive
                              ? 52
                              : 38
                            : isActive
                              ? isCompactMobile
                                ? 44
                                : 58
                              : isCompactMobile
                                ? 32
                                : 42,
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0 : 0.38,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className={`relative h-9 shrink-0 overflow-hidden rounded-xl border transition-colors sm:h-11 ${
                          isActive
                            ? "border-emerald-400 shadow-[0_0_16px_rgba(16,240,160,0.35)]"
                            : "border-white/15 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={slide.image}
                          alt=""
                          width={1376}
                          height={768}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0.5 right-1 font-mono text-[9px] font-bold drop-shadow ${
                            isActive ? "text-emerald-300" : "text-slate-200"
                          }`}
                        >
                          {slide.indexLabel}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function DefenseCardSurface({
  slide,
  active,
  prefersReducedMotion,
}: {
  slide: DefenseSlide;
  active: boolean;
  prefersReducedMotion: boolean;
}) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl border bg-slate-900 shadow-2xl transition-colors duration-300 ${
        active
          ? "border-emerald-400/70 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),0_0_24px_rgba(16,240,160,0.22)]"
          : "border-white/15 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.85)]"
      }`}
    >
      <motion.img
        src={slide.image}
        alt={slide.alt}
        width={1376}
        height={768}
        draggable={false}
        loading="lazy"
        decoding="async"
        animate={{ scale: prefersReducedMotion ? 1 : active ? 1.07 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full select-none object-cover will-change-transform"
      />
      {/* Diagonal glass sheen reflection (Vynora pattern) */}
      <div aria-hidden="true" className="ag-glass-specular pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/20"
      />

      {/* Top edge specular pulse for active focus */}
      {active && (
        <div
          aria-hidden="true"
          className="absolute inset-x-1/4 top-0 h-0.5 rounded-full bg-emerald-300/75 blur-[1px]"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 p-3.5 text-left sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TONE_BADGE[slide.statusTone]}`}
          >
            LAYER {slide.indexLabel}
          </span>
          {active && (
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-glow" />
          )}
        </div>
        <p className="mt-2 font-display text-sm font-semibold leading-snug text-slate-50 sm:text-base">
          {slide.title}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-cyan-200/85">
          {slide.metricValue}
        </p>
      </div>
    </div>
  );
}
