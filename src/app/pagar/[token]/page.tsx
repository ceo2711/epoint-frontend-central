import { Suspense } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PublicPaymentPage } from "@/features/payments/components/PublicPaymentPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <PublicPaymentPage />
    </Suspense>
  );
}
