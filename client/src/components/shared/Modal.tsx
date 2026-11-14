import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { InteractiveIconButton } from "./InteractiveIconButton";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ag-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-hairline-bright bg-surface shadow-panel">
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id="ag-modal-title" className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          <InteractiveIconButton tone="danger" compact onClick={onClose} label="Close modal">
            <X className="h-4 w-4" aria-hidden="true" />
          </InteractiveIconButton>
        </div>
        <div className="max-h-[82dvh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}

