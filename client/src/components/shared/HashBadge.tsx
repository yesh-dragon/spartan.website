import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { shortHash } from "../../lib/format";

export function HashBadge({
  hash,
  label,
  broken = false,
}: {
  hash: string;
  label?: string;
  broken?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={hash}
      aria-label={copied ? `Copied ${label ?? "hash"}` : `Copy ${label ?? "hash"} ${shortHash(hash)}`}
      className={`group inline-flex min-h-[32px] items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-[color,border-color,background-color,transform] duration-200 active:scale-95 ${
        broken
          ? "border-danger/50 bg-danger/10 text-danger"
          : copied
            ? "border-accent/50 bg-accent/15 text-accent"
            : "border-hairline bg-surface-2 text-ink-muted hover:border-telemetry/45 hover:bg-telemetry/10 hover:text-telemetry"
      }`}
    >
      {label && <span className="text-ink-dim">{label}</span>}
      <span>{shortHash(hash)}</span>
      {copied ? (
        <Check className="ag-icon-pop h-3 w-3 text-accent" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3 opacity-75 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
      )}
    </button>
  );
}

