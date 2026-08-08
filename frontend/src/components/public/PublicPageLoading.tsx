import React from "react";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

interface PublicPageLoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export function PublicPageLoading({
  label = "Loading public website content...",
  fullScreen = false,
}: PublicPageLoadingProps) {
  return (
    <GlobalLoading
      label={label}
      variant={fullScreen ? "fullscreen" : "card"}
      sublabel="Please wait a moment"
    />
  );
}
