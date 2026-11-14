import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({
  code,
  filename,
  language = "ts",
}: {
  code: string;
  filename?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-panel">
      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-surface-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
          <span className="truncate font-mono text-xs text-ink-muted">
            {filename ?? language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied to clipboard" : "Copy code snippet"}
          className={`group relative inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-[color,border-color,background-color,transform] duration-200 active:scale-95 ${
            copied
              ? "border-accent/50 bg-accent/15 text-accent"
              : "border-hairline bg-surface text-ink-muted hover:border-accent/45 hover:bg-accent/10 hover:text-accent"
          }`}
        >
          {copied ? (
            <>
              <Check className="ag-icon-pop h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-canvas/70 p-4 font-mono text-xs leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

