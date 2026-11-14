import { Cpu, FileSearch, LockKeyhole, Shield } from "lucide-react";
import { ParallaxMedia, ScrollReveal } from "../shared/ScrollMotion";

const PILLARS = [
  {
    num: "01",
    title: "Input Scanner",
    subtitle: "Rule AST + Gemini Judge",
    description:
      "Normalizes whitespace, strips invisible zero-width and bidi controls, parses inline CSS concealment with cheerio, and invokes Gemini only when rules are not already ≥95% certain.",
    icon: FileSearch,
    metrics: ["12 built-in override rules", "14 invisible Unicode checks", "Fail-closed AI fallback"],
  },
  {
    num: "02",
    title: "Data Shield",
    subtitle: "Zero Raw Secret Storage",
    description:
      "Inspects outbound subjects, bodies, recipients, and attachments before egress. Raw matched values are masked immediately and never committed to Postgres or logs.",
    icon: LockKeyhole,
    metrics: ["Aadhaar Verhoeff D5", "PAN + 16 UPI banks", "Google / OpenAI / AWS / GitHub / Slack"],
  },
  {
    num: "03",
    title: "Action Firewall",
    subtitle: "Human-in-the-Loop Gate",
    description:
      "Every proposed send, reply, forward, or file share pauses with a 15-minute expiration timer. Sensitive hits escalate to critical with one-click redaction.",
    icon: Shield,
    metrics: ["Mandatory pause on egress", "Elevated source-taint flag", "Auto-expire background sweep"],
  },
  {
    num: "04",
    title: "Explainable Audit Ledger",
    subtitle: "Plain Language + SHA-256",
    description:
      "Translates arcane injection attempts into plain 1–2 sentence alerts for non-technical users, while locking every security event into a per-user hash chain.",
    icon: Cpu,
    metrics: ["Advisory-locked seq", "Deterministic canonical JSON", "Live tamper verification"],
  },
];

export function FourPillars() {
  return (
    <section className="relative overflow-hidden border-b border-hairline py-20 sm:py-24">
      {/* Subtle dark architectural topology backdrop with smooth scroll parallax */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <ParallaxMedia
          src="/assets/threat-topology-mesh.jpg"
          alt=""
          ariaHidden
          fillParent
          width={1376}
          height={768}
          shiftY={34}
          scaleRange={[1.05, 1.15]}
          imgClassName="opacity-22"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/85 to-canvas" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-telemetry">
            Four Core Primitives
          </p>
          <h2 className="mt-2 font-display text-fluid-h2 font-bold tracking-tight text-ink">
            Engineered like a network firewall, built for AI tool calls
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PILLARS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <ScrollReveal key={p.num} delay={idx * 0.07}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-surface/90 p-4 backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-accent/40 hover:shadow-panel sm:p-6">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-[transform,border-color,background-color] duration-200 group-hover:scale-110 group-hover:border-accent/60 group-hover:bg-accent/20">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-mono text-[11px] text-ink-dim">
                          PILLAR {p.num} · {p.subtitle}
                        </p>
                        <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">{p.description}</p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {p.metrics.map((m) => (
                      <li
                        key={m}
                        className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-ink-muted"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

