import { Bug } from "lucide-react";
import { Button } from "../shared/Button";

export function SimulateTamperButton({
  loading,
  onClick,
  disabled,
}: {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="danger"
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      icon={<Bug className="h-4 w-4" />}
    >
      Simulate Tamper
    </Button>
  );
}

