import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Badge } from "../shared/Badge";
import { CodeBlock } from "../shared/CodeBlock";
import { ScrollReveal } from "../shared/ScrollMotion";

const TABS = [
  {
    id: "two-lines",
    label: "Two-Line Core",
    filename: "agent-wrapper.ts",
    code: `import { createGuard } from "@agent-guard/core";

const guard = createGuard({ mode: "enforce" });

// 1. Scan untrusted input before your model sees it
const verdict = await guard.checkInput(emailBody);
if (verdict.effectiveVerdict === "block") {
  return { quarantined: true, reason: verdict.explanation };
}

// 2. Scan proposed tool call before side effects leave your boundary
const decision = await guard.checkAction({
  action: "send_email",
  to: ["partner@company.example"],
  subject: draft.subject,
  body: draft.body,
  sourceVerdict: verdict.verdict,
});`,
  },
  {
    id: "judge-adapter",
    label: "With Gemini Judge",
    filename: "gemini-judge-adapter.ts",
    code: `import { createGuard } from "@agent-guard/core";
import { createGeminiJudge } from "./services/judge";

const guard = createGuard({
  mode: "enforce",
  judgeEnabled: true,
  customPhrases: ["export payroll", "dump customer db"],
  judge: createGeminiJudge(), // invoked only when rules < 95% confident
});

const verdict = await guard.checkInput(rawEmailHtml, {
  subject: email.subject,
});`,
  },
  {
    id: "audit-verify",
    label: "Verify Hash Chain",
    filename: "verify-audit.ts",
    code: `import { verifyAuditChain } from "@agent-guard/core";

const result = verifyAuditChain(auditRows);
if (!result.valid) {
  console.error(\`Tamper detected at seq #\${result.brokenAtSeq}: \${result.reason}\`);
} else {
  console.log(\`Verified \${result.checked} chained audit records.\`);
}`,
  },
];

export function CodeSnippetTabs() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section id="integration" className="border-b border-hairline py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <Badge tone="accent">Framework-Free Package: @agent-guard/core</Badge>
          <h2 className="mt-3 font-display text-fluid-h2 font-bold tracking-tight text-ink">
            Drop-in TypeScript protection with zero framework lock-in
          </h2>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm text-ink-muted sm:text-base">
            No LangChain wrappers, no local ML model downloads. Import{" "}
            <code className="text-accent">createGuard()</code> in any Node or TypeScript backend.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TABS.map((t) => {
              const isSelected = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  aria-pressed={isSelected}
                  className={`relative min-h-[44px] overflow-hidden rounded-lg border px-4 py-2 font-mono text-xs font-medium transition-colors sm:min-h-[36px] ${
                    isSelected
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-hairline bg-surface text-ink-muted hover:border-hairline-bright hover:text-ink"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="ag-code-tab-glow"
                      aria-hidden="true"
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 30,
                        duration: prefersReducedMotion ? 0 : undefined,
                      }}
                      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent via-telemetry to-accent"
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <CodeBlock code={current.code} filename={current.filename} />
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

