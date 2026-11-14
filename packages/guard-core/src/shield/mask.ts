import type { SensitiveDataType } from "@agent-guard/shared";

/** Produces a safe masked preview; raw values are never persisted or logged. */
export function maskSensitiveValue(type: SensitiveDataType, rawValue: string): string {
  switch (type) {
    case "aadhaar": {
      const digits = rawValue.replace(/\D/g, "");
      return `XXXX XXXX ${digits.slice(-4)}`;
    }
    case "pan": {
      const clean = rawValue.trim().toUpperCase();
      return `XXXXX••${clean.slice(-3)}`;
    }
    case "upi_id": {
      const atIdx = rawValue.indexOf("@");
      if (atIdx <= 0) return "••@upi";
      const handle = rawValue.slice(0, atIdx);
      const bank = rawValue.slice(atIdx + 1).toLowerCase();
      const prefix = handle.slice(0, Math.min(2, handle.length));
      return `${prefix}***@${bank}`;
    }
    case "phone_in": {
      const digits = rawValue.replace(/\D/g, "");
      return `+91 ••••••${digits.slice(-4)}`;
    }
    case "api_key": {
      const clean = rawValue.trim();
      if (clean.length <= 8) return "••••••••";
      return `${clean.slice(0, 4)}••••••••${clean.slice(-4)}`;
    }
  }
}

export function redactionToken(type: SensitiveDataType): string {
  return `[REDACTED:${type.toUpperCase()}]`;
}

