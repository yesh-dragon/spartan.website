import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Terminal, Zap } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Button } from "../shared/Button";
import { CodeBlock } from "../shared/CodeBlock";
import { BorderBeam } from "../shared/Card";

const TWO_LINE_SNIPPET = `import { createGuard } from "@agent-guard/core";

const guard = createGuard({ mode: "enforce" });

const verdict = await guard.checkInput(emailBody);            // before the agent reads it
const decision = await guard.checkAction(agentProposedAction); // before the agent acts`;

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  const coreY = useTransform(smoothScroll, [0, 1], [-18, 18]);
  const coreScale = useTransform(smoothScroll, [0, 1], [1.04, 1.14]);
  const outerRingRotate = useTransform(smoothScroll, [0, 1], [0, 52]);
  const innerRingRotate = useTransform(smoothScroll, [0, 1], [0, -38]);
  const hudFloatY = useTransform(smoothScroll, [0, 1], [0, -10]);
  const glowOpacity = useTransform(smoothScroll, [0, 0.85], [0.95, 0.3]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-hairline pb-20 pt-14 sm:pb-24 sm:pt-20"
    >
      {/* Ambient top radial beam */}
      <motion.div
        aria-hidden="true"
        style={prefersReducedMotion ? undefined : { opacity: glowOpacity }}
        className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[880px] -translate-x-1/2 rounded-full bg-accent/12 blur-[140px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* Left narrative + two-line terminal */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-7"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface-2/90 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            Runtime Security Perimeter for Autonomous Agents
          </div>

          <h1 className="mt-5 font-display text-fluid-hero font-bold tracking-tight text-ink">
            Two lines of code to{" "}
            <span className="text-accent">protect any agent.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Agent Guard sits between untrusted inputs and your LLM, and between your agent and the
            outside world. Stop hidden prompt injections, intercept Aadhaar, PAN, UPI, and API-key
            exfiltration, and lock every action in a SHA-256 tamper-evident audit chain.
          </p>

          <div className="relative mt-8 overflow-hidden rounded-xl border border-hairline-bright bg-surface shadow-panel">
            <BorderBeam tone="accent" />
            <div className="relative z-10 p-1">
              <CodeBlock code={TWO_LINE_SNIPPET} filename="guard-integration.ts" />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <Link to="/signup">
              <Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Try the demo
              </Button>
            </Link>
            <a href="#attack-loop">
              <Button variant="secondary" size="lg" icon={<Terminal className="h-4 w-4" />}>
                Watch live attack defense
              </Button>
            </a>
          </div>

          <dl className="mt-9 grid grid-cols-1 gap-4 border-t border-hairline pt-6 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Rule Scanner
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-ink tabular-nums">
                &lt; 2 ms
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Data Shield
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-accent">
                Verhoeff + PII
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-dim">
                Audit Integrity
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-telemetry">
                SHA-256 Chain
              </dd>
            </div>
          </dl>
        </motion.div>

        {/* Right visual: Bespoke dark cryptographic core + SVG perimeter HUD */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="relative lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-3 shadow-panel">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950">
              <motion.img
                src="/assets/hero-perimeter-core.jpg"
                alt="Architectural schematic of the Agent Guard cryptographic inspection core and packet barrier rings"
                width={1376}
                height={768}
                loading="eager"
                decoding="async"
                style={
                  prefersReducedMotion
                    ? undefined
                    : { y: coreY, scale: coreScale, height: "calc(100% + 40px)", top: "-20px" }
                }
                className="relative h-full w-full object-cover opacity-95 will-change-transform"
              />
              {/* Edge vignette blending image smoothly inside telemetry monitor frame */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/30"
              />
              {/* Living telemetry scanline pulse */}
              <div
                aria-hidden="true"
                className="scanline-sweep pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-emerald-400/15 via-cyan-400/10 to-transparent"
              />
              {/* Scroll-driven counter-rotating SVG Perimeter Telemetry Ring Overlay */}
              <svg
                viewBox="0 0 400 300"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <motion.g
                  style={{
                    originX: "200px",
                    originY: "150px",
                    rotate: prefersReducedMotion ? 0 : outerRingRotate,
                  }}
                >
                  <circle
                    cx="200"
                    cy="150"
                    r="118"
                    fill="none"
                    stroke="rgba(16, 240, 160, 0.30)"
                    strokeWidth="1.15"
                    strokeDasharray="6 8"
                    className="origin-center animate-spin-slow"
                  />
                </motion.g>
                <motion.g
                  style={{
                    originX: "200px",
                    originY: "150px",
                    rotate: prefersReducedMotion ? 0 : innerRingRotate,
                  }}
                >
                  <circle
                    cx="200"
                    cy="150"
                    r="94"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.28)"
                    strokeWidth="1"
                    strokeDasharray="2 10"
                  />
                </motion.g>
              </svg>
              {/* Rotor-style Floating Telemetry Coordinate HUD */}
              <motion.div
                style={prefersReducedMotion ? undefined : { y: hudFloatY }}
                className="ag-glass-dock pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-white/15 px-3 py-1.5 font-mono text-[10px] text-slate-200 will-change-transform"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <span>CAM CORE</span>
                <span className="text-slate-400">·</span>
                <span className="text-cyan-300">θ 0° / Z 2.4</span>
              </motion.div>
            </div>

            {/* Hardware-grade telemetry footer bar */}
            <div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3 sm:grid-cols-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    Ingress Gate
                  </p>
                  <p className="font-mono text-xs font-medium text-ink">DOM + Unicode AST</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-telemetry/30 bg-telemetry/10 text-telemetry">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    Egress Gate
                  </p>
                  <p className="font-mono text-xs font-medium text-ink">Human-in-Loop Lock</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

