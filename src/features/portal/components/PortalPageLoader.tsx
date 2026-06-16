import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function PortalPageLoader({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-16">
      <LoadingSpinner label={label} />
    </div>
  );
}
