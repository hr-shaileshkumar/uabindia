import type { ReactNode } from "react";
import { ProtectedWorkspaceShell } from "@/components/layout/ProtectedWorkspaceShell";
import { ProtectedProviders } from "./_components/ProtectedProviders";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedProviders>
      <ProtectedWorkspaceShell>{children}</ProtectedWorkspaceShell>
    </ProtectedProviders>
  );
}

