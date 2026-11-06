"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  hasExplicitPublicTenantContext,
  normalizePublicAudience,
  resolvePublicAudience,
  type PublicAudience,
} from "@/lib/public-audience";

type UseResolvedPublicAudienceResult = {
  audience: PublicAudience;
  isTenantContext: boolean;
};

export function useResolvedPublicAudience(): UseResolvedPublicAudienceResult {
  const searchParams = useSearchParams();
  const requestedAudience = searchParams?.get("audience") ?? null;
  const normalizedRequestedAudience = normalizePublicAudience(requestedAudience);
  const [detectedTenantContext, setDetectedTenantContext] = useState(false);

  useEffect(() => {
    setDetectedTenantContext(hasExplicitPublicTenantContext());
  }, []);

  const isTenantContext = normalizedRequestedAudience === "tenant" || detectedTenantContext;
  const audience = useMemo(
    () => resolvePublicAudience(requestedAudience, isTenantContext),
    [isTenantContext, requestedAudience]
  );

  return { audience, isTenantContext };
}
