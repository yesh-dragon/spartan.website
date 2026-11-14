import { useMemo } from "react";
import DOMPurify from "dompurify";
import type { EmailRecord, GuardVerdict } from "@agent-guard/shared";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { formatTimestamp } from "../../lib/format";

export function EmailViewer({
  email,
  revealAiView,
  onToggleReveal,
  scanVerdict,
  scanningReveal,
}: {
  email: EmailRecord;
  revealAiView: boolean;
  onToggleReveal: () => void;
  scanVerdict: GuardVerdict | null;
  scanningReveal: boolean;
}) {
  const { theme } = useTheme();

  // Sanitize HTML strictly and wrap inside a theme-matched sandboxed iframe document (sandbox="", zero scripts)
  const sandboxSrcDoc = useMemo(() => {
    const cleanHtml = DOMPurify.sanitize(email.body_html, {
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "meta", "link"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    });
    const bg = theme === "light" ? "#ffffff" : "#090e18";
    const fg = theme === "light" ? "#0b1220" : "#e2e8f0";
    return `<!doctype html><html><head><style>
      body { margin: 0; padding: 16px; background: ${bg}; color: ${fg}; font-family: Inter, system-ui, sans-serif; font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
      p { margin: 0 0 10px 0; }
      ul { margin: 0 0 10px 18px; padding: 0; }
      li { margin-bottom: 4px; }
    </style></head><body>${cleanHtml}</body></html>`;
  }, [email.body_html, theme]);

  return (
    <div className="rounded-xl border border-hairline bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink [overflow-wrap:anywhere]">
              {email.subject}
            </h2>
            {email.quarantined && <Badge tone="danger">Quarantined</Badge>}
          </div>
          <p className="mt-1 font-mono text-xs text-ink-muted [overflow-wrap:anywhere]">
            From: <span className="text-ink">{email.from_address}</span> ·{" "}
            <span className="text-ink-dim">{formatTimestamp(email.received_at)}</span>
          </p>
        </div>

        <Button
          size="sm"
          variant={revealAiView ? "warning" : "secondary"}
          onClick={onToggleReveal}
          disabled={scanningReveal}
          className="w-full sm:w-auto"
          icon={
            scanningReveal ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : revealAiView ? (
              <EyeOff className="ag-icon-pop h-3.5 w-3.5" />
            ) : (
              <Eye className="ag-icon-pop h-3.5 w-3.5" />
            )
          }
        >
          {revealAiView ? "Show Human View" : "Reveal what the AI sees"}
        </Button>
      </div>

      {!revealAiView ? (
        <div className="relative p-3">
          <iframe
            title={`Sandboxed email body for ${email.subject}`}
            sandbox=""
            srcDoc={sandboxSrcDoc}
            className="h-52 w-full rounded-lg border border-hairline bg-surface"
          />
          <p className="mt-2 px-1 font-mono text-[10px] text-ink-dim">
            Rendered safely inside a scriptless sandbox="" iframe after DOMPurify sanitization.
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-warning">
              Scanner-Extracted Text & Concealed Payloads
            </span>
            {scanVerdict && (
              <div className="flex flex-wrap gap-2">
                <Badge tone={scanVerdict.hiddenSegments.length > 0 ? "danger" : "neutral"}>
                  Hidden HTML: {scanVerdict.hiddenSegments.length}
                </Badge>
                <Badge tone={scanVerdict.invisibleUnicodeCount > 0 ? "danger" : "neutral"}>
                  Invisible Chars: {scanVerdict.invisibleUnicodeCount}
                </Badge>
              </div>
            )}
          </div>

          {!scanVerdict ? (
            <div className="rounded-lg border border-hairline bg-canvas p-4 font-mono text-xs text-ink-muted">
              Running Input Scanner inspection...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-hairline bg-canvas p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                  Visible Extracted Text
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">
                  {scanVerdict.visibleText || "(No visible text)"}
                </p>
              </div>

              {scanVerdict.hiddenSegments.length > 0 && (
                <div className="space-y-2 rounded-lg border border-danger/45 bg-danger/10 p-4">
                  <div className="flex items-center gap-2 text-danger">
                    <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Hidden Segments Readable by AI
                    </span>
                  </div>
                  {scanVerdict.hiddenSegments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-danger/30 bg-canvas/80 p-3 font-mono text-xs"
                    >
                      <span className="mb-1 inline-block rounded bg-danger/20 px-1.5 py-0.5 text-[10px] text-danger">
                        {seg.technique}
                      </span>
                      <p className="mt-1 break-words text-ink">{seg.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {scanVerdict.invisibleUnicodeCount > 0 && (
                <div className="rounded-lg border border-warning/45 bg-warning/10 p-4 font-mono text-xs">
                  <p className="font-semibold text-warning">
                    Detected {scanVerdict.invisibleUnicodeCount} invisible/zero-width Unicode
                    characters
                  </p>
                  <p className="mt-1 text-ink-muted">
                    Character offsets:{" "}
                    <span className="text-ink">
                      [{scanVerdict.invisibleUnicodeOffsets.slice(0, 30).join(", ")}
                      {scanVerdict.invisibleUnicodeOffsets.length > 30 ? ", …" : ""}]
                    </span>
                  </p>
                </div>
              )}

              {scanVerdict.hiddenSegments.length === 0 &&
                scanVerdict.invisibleUnicodeCount === 0 && (
                  <p className="font-mono text-xs text-accent">
                    No concealed HTML blocks or zero-width Unicode characters detected.
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

