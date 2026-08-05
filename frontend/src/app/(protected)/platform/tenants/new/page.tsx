"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedNewTenantPage() {
  const router = useRouter();
  
  // We've moved to a Drawer-based creation flow in the new architecture.
  // Redirecting the old route to the main tenants dashboard.
  useEffect(() => {
    router.replace("/platform/tenants");
  }, [router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
      Redirecting to the new tenant dashboard...
    </div>
  );
}
