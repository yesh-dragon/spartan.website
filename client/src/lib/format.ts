export function shortHash(hash: string, prefix = 8, suffix = 8): string {
  if (!hash) return "—";
  if (hash.length <= prefix + suffix + 2) return hash;
  return `${hash.slice(0, prefix)}…${hash.slice(-suffix)}`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const absSec = Math.floor(Math.abs(diffMs) / 1000);
  if (absSec < 60) return diffMs >= 0 ? "just now" : `in ${absSec}s`;
  const min = Math.floor(absSec / 60);
  if (min < 60) return diffMs >= 0 ? `${min}m ago` : `in ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return diffMs >= 0 ? `${hr}h ago` : `in ${hr}h`;
  const days = Math.floor(hr / 24);
  return diffMs >= 0 ? `${days}d ago` : `in ${days}d`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCountdown(expiresIso: string): string {
  const remainingMs = new Date(expiresIso).getTime() - Date.now();
  if (remainingMs <= 0) return "Expired";
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatDataTypeLabel(type: string): string {
  switch (type) {
    case "aadhaar":
      return "Aadhaar";
    case "pan":
      return "PAN Card";
    case "upi_id":
      return "UPI ID";
    case "phone_in":
      return "Phone (IN)";
    case "api_key":
      return "API Key";
    default:
      return type;
  }
}

export function formatAttackTypeLabel(attackType: string | null | undefined): string {
  switch (attackType) {
    case "instruction_override":
      return "Instruction Override";
    case "hidden_content":
      return "Hidden Content";
    case "data_exfiltration":
      return "Data Exfiltration";
    default:
      return "None";
  }
}

