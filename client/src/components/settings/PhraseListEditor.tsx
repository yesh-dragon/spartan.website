import { useState, type FormEvent } from "react";
import { Plus, ShieldAlert, X } from "lucide-react";
import { Button } from "../shared/Button";

export function PhraseListEditor({
  phrases,
  onChange,
}: {
  phrases: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > 80) {
      setError("Phrase must be 80 characters or fewer.");
      return;
    }
    if (phrases.length >= 20) {
      setError("Maximum of 20 custom blocked phrases reached.");
      return;
    }
    if (phrases.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setError("That phrase is already in your custom blocklist.");
      return;
    }
    onChange([...phrases, trimmed]);
    setDraft("");
  };

  const handleRemove = (index: number) => {
    onChange(phrases.filter((_, idx) => idx !== index));
  };

  return (
    <section className="rounded-xl border border-hairline bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-warning">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Custom Blocked Phrases
            </h2>
            <p className="text-xs text-ink-muted">
              Organization-specific instruction triggers checked alongside the 12 core rules
            </p>
          </div>
        </div>
        <span className="font-mono text-xs text-ink-dim">{phrases.length} / 20</span>
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={draft}
          maxLength={80}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. export payroll database, confidential board deck"
          aria-label="Add custom blocked phrase"
          className="ag-recessed-input h-10 w-full min-w-0 flex-1 rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-ink-dim focus:border-accent/60 focus:outline-none sm:w-auto sm:min-w-[220px]"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={!draft.trim() || phrases.length >= 20}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Phrase
        </Button>
      </form>

      {error && (
        <p className="mt-2 font-mono text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {phrases.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-hairline bg-canvas/50 px-4 py-3 text-xs text-ink-dim">
          No custom phrases configured. Built-in rule signatures remain active.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {phrases.map((phrase, idx) => (
            <li
              key={`${phrase}-${idx}`}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink"
            >
              <span>{phrase}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Remove ${phrase}`}
                className="rounded p-0.5 text-ink-dim hover:bg-danger/15 hover:text-danger"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

