export function Skeleton({ className = "h-5 w-full" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-surface-2/90 ${className}`}
    />
  );
}

