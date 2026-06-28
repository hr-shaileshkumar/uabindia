"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  hasExplicitPublicTenantContext,
  resolvePublicAudience,
  type PublicAudience,
} from "@/lib/public-audience";

type UseResolvedPublicAudienceResult = {
  audience: PublicAudience;
  isTenantContext: boolean;
};

export function useResolvedPublicAudience(): UseResolvedPublicAudienceResult {
  const searchParams = useSearchParams();
  const requestedAudience = searchParams.get("audience");
  const isTenantContext = hasExplicitPublicTenantContext();
  const audience = useMemo(
    () => resolvePublicAudience(requestedAudience, isTenantContext),
    [isTenantContext, requestedAudience]
  );

  return { audience, isTenantContext };
}
