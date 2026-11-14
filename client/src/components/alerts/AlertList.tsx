import type { AlertRecord } from "@agent-guard/shared";
import { BellOff } from "lucide-react";
import { EmptyState } from "../shared/EmptyState";
import { AlertCard } from "./AlertCard";

export function AlertList({
  alerts,
  ackingId,
  onAcknowledge,
}: {
  alerts: AlertRecord[];
  ackingId: string | null;
  onAcknowledge: (id: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<BellOff className="h-5 w-5" />}
        title="No matching security alerts"
        description="When Agent Guard flags or blocks an email injection or data leak attempt, a plain-language alert appears here."
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {alerts.map((a) => (
        <AlertCard
          key={a.id}
          alert={a}
          acking={ackingId === a.id}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
}

