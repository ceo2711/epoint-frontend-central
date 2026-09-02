import { HiCheck } from "react-icons/hi2";

export function CompletionCornerCheck({ label }: { label: string }) {
  return (
    <span className="portal-done-check" title={label} aria-label={label}>
      <HiCheck className="h-4 w-4" aria-hidden />
    </span>
  );
}
