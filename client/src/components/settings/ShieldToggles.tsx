import type { SensitiveDataType, ShieldConfig } from "@agent-guard/shared";
import { LockKeyhole } from "lucide-react";

const SHIELD_ITEMS: Array<{
  key: SensitiveDataType;
  label: string;
  patternSummary: string;
  exampleMask: string;
}> = [
  {
    key: "aadhaar",
    label: "Aadhaar Number (IN)",
    patternSummary: "12 digits starting 2–9 with Verhoeff D5 checksum verification",
    exampleMask: "XXXX XXXX 0124",
  },
  {
    key: "pan",
    label: "PAN Card (IN)",
    patternSummary: "Permanent Account Number matching [A-Z]{5}[0-9]{4}[A-Z]",
    exampleMask: "ABXXXXX34F",
  },
  {
    key: "upi_id",
    label: "UPI ID (IN)",
    patternSummary: "Payment handles across 16 Indian bank suffixes (@okaxis, @oksbi, @ybl…)",
    exampleMask: "ar***@okaxis",
  },
  {
    key: "phone_in",
    label: "Indian Phone Number",
    patternSummary: "10 digits starting 6–9 with optional +91 / 91 / 0 prefix",
    exampleMask: "+91 XXXXXX3210",
  },
  {
    key: "api_key",
    label: "API Keys & Secrets",
    patternSummary: "Google AIza, OpenAI sk-, AWS AKIA, GitHub gh_, Slack xox, generic secret=",
    exampleMask: "AIzaSy******ijkl",
  },
];

export function ShieldToggles({
  shield,
  onChange,
}: {
  shield: ShieldConfig;
  onChange: (next: ShieldConfig) => void;
}) {
  const toggleKey = (key: SensitiveDataType) => {
    onChange({
      ...shield,
      [key]: !shield[key],
    });
  };

  return (
    <section className="rounded-xl border border-hairline bg-surface p-5 shadow-panel">
      <div className="flex items-center gap-2.5 border-b border-hairline pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-accent">
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            Outbound Data Shield Detectors
          </h2>
          <p className="text-xs text-ink-muted">
            Matched values are masked in previews (<code className="font-mono text-ink">XXXX</code>)
            and flagged <code className="font-mono text-ink">critical</code> for human redaction —
            raw values are never persisted.
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-hairline">
        {SHIELD_ITEMS.map((item) => {
          const active = shield[item.key];
          return (
            <div
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-1"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-medium text-ink">{item.label}</p>
                  <code className="rounded border border-hairline bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-accent">
                    {item.exampleMask}
                  </code>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{item.patternSummary}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label={`Toggle ${item.label}`}
                onClick={() => toggleKey(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                  active ? "border-accent/60 bg-accent/25" : "border-hairline bg-canvas"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    active ? "translate-x-5 bg-accent" : "translate-x-1 bg-ink-dim"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

