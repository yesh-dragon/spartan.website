export function RedactionPreview({ text }: { text: string }) {
  const parts = text.split(/(\[REDACTED:[A-Z_]+\])/g);

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-3.5 font-mono text-xs leading-relaxed text-ink">
      {parts.map((part, idx) =>
        /^\[REDACTED:[A-Z_]+\]$/.test(part) ? (
          <span
            key={idx}
            className="mx-0.5 inline-block rounded border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent"
          >
            {part}
          </span>
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </div>
  );
}

