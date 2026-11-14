import { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { StatsResponse } from "../../lib/api";
import { Badge } from "../shared/Badge";

export function ThreatTimelineChart({
  timeline,
}: {
  timeline: StatsResponse["timeline"];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const buckets = timeline.slice(-7);
  const maxTotal = Math.max(
    4,
    ...buckets.map((b) => b.blocked + b.warned + b.allowed),
  );
  const totalScans = buckets.reduce((acc, b) => acc + b.blocked + b.warned + b.allowed, 0);

  const activeBucket = hoveredIdx !== null ? buckets[hoveredIdx] : null;

  return (
    <section className="rounded-xl border border-hairline bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-telemetry">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Scan Verdicts Over Time
            </h2>
            <p className="text-xs text-ink-muted">
              Daily distribution across blocked, warned, and allowed checks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-danger" aria-hidden="true" />
            Blocked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-warning" aria-hidden="true" />
            Warned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />
            Allowed
          </span>
        </div>
      </div>

      {totalScans === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <Badge tone="neutral">No telemetry yet</Badge>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Run a scan or ask MailPilot to summarize an email in the Playground to populate the
            daily verdict chart.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="mb-3 flex h-7 items-center justify-between rounded-lg border border-hairline bg-surface-2/60 px-3 font-mono text-xs">
            {activeBucket ? (
              <>
                <span className="text-ink">{activeBucket.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-danger">{activeBucket.blocked} blocked</span>
                  <span className="text-warning">{activeBucket.warned} warned</span>
                  <span className="text-accent">{activeBucket.allowed} allowed</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-ink-dim">7-day rolling telemetry</span>
                <span className="text-ink-muted">{totalScans} total scans shown</span>
              </>
            )}
          </div>

          <svg
            viewBox="0 0 560 200"
            className="h-52 w-full overflow-visible"
            role="img"
            aria-label="Daily security scan verdicts bar chart"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = 165 - frac * 140;
              const tickVal = Math.round(maxTotal * frac);
              return (
                <g key={frac}>
                  <line
                    x1="36"
                    y1={y}
                    x2="548"
                    y2={y}
                    className="stroke-hairline"
                    strokeDasharray={frac === 0 ? undefined : "3 4"}
                    strokeWidth="1"
                  />
                  <text
                    x="28"
                    y={y + 4}
                    textAnchor="end"
                    className="fill-ink-dim font-mono text-[10px]"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Stacked bars per day */}
            {buckets.map((b, idx) => {
              const count = Math.max(1, buckets.length);
              const slotWidth = 500 / count;
              const barWidth = Math.min(42, slotWidth * 0.52);
              const x = 44 + idx * slotWidth + (slotWidth - barWidth) / 2;

              const totalH = ((b.blocked + b.warned + b.allowed) / maxTotal) * 140;
              const allowH = (b.allowed / maxTotal) * 140;
              const warnH = (b.warned / maxTotal) * 140;
              const blockH = (b.blocked / maxTotal) * 140;

              const allowY = 165 - allowH;
              const warnY = allowY - warnH;
              const blockY = warnY - blockH;
              const active = hoveredIdx === idx;

              return (
                <g
                  key={b.date}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  className="cursor-pointer outline-none"
                >
                  {/* Hover column backdrop */}
                  <rect
                    x={x - 6}
                    y="18"
                    width={barWidth + 12}
                    height="148"
                    rx="6"
                    className={active ? "fill-surface-2/90" : "fill-transparent"}
                  />

                  {totalH === 0 ? (
                    <rect
                      x={x}
                      y="163"
                      width={barWidth}
                      height="2"
                      rx="1"
                      className="fill-hairline-bright"
                    />
                  ) : (
                    <>
                      {allowH > 0 && (
                        <rect
                          x={x}
                          y={allowY}
                          width={barWidth}
                          height={allowH}
                          rx="2"
                          className="fill-accent/85 transition-opacity"
                        />
                      )}
                      {warnH > 0 && (
                        <rect
                          x={x}
                          y={warnY}
                          width={barWidth}
                          height={warnH}
                          rx="2"
                          className="fill-warning/90 transition-opacity"
                        />
                      )}
                      {blockH > 0 && (
                        <rect
                          x={x}
                          y={blockY}
                          width={barWidth}
                          height={blockH}
                          rx="2"
                          className="fill-danger/90 transition-opacity"
                        />
                      )}
                    </>
                  )}

                  <text
                    x={x + barWidth / 2}
                    y="185"
                    textAnchor="middle"
                    className={`font-mono text-[10px] ${
                      active ? "fill-ink" : "fill-ink-dim"
                    }`}
                  >
                    {b.date.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

