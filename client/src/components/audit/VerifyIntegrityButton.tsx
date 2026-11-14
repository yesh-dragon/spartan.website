import { ShieldCheck } from "lucide-react";
import { Button } from "../shared/Button";

export function VerifyIntegrityButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="primary"
      loading={loading}
      onClick={onClick}
      icon={<ShieldCheck className="h-4 w-4" />}
    >
      Verify Integrity
    </Button>
  );
}

