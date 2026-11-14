import type { AuditVerifyResult } from "@agent-guard/shared";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export function IntegrityResultBanner({ result }: { result: AuditVerifyResult }) {
  if (result.valid) {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/45 bg-accent/10 p-4 shadow-glow"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-semibold text-accent">
              Cryptographic Integrity Verified
            </p>
            <p className="text-xs text-ink">
              Checked <strong className="font-mono">{result.checked}</strong> hash-chained audit{" "}
              {result.checked === 1 ? "entry" : "entries"} from genesis hash — zero tampering
              detected.
            </p>
          </div>
        </div>
        <span className="rounded-md border border-accent/35 bg-canvas px-2.5 py-1 font-mono text-[11px] font-semibold text-accent">
          CHAIN INTACT
        </span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/60 bg-danger/15 p-4 shadow-glow-danger"
    >
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <p className="font-display text-sm font-semibold text-danger">
            Audit Chain Tampering Detected at Entry #{result.brokenAtSeq}
          </p>
          <p className="text-xs text-ink">{result.reason}</p>
        </div>
      </div>
      <span className="rounded-md border border-danger/50 bg-canvas px-2.5 py-1 font-mono text-[11px] font-semibold text-danger">
        BROKEN AT SEQ #{result.brokenAtSeq}
      </span>
    </div>
  );
}

