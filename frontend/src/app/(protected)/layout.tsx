import type { ReactNode } from "react";
import { ProtectedWorkspaceShell } from "@/components/layout/ProtectedWorkspaceShell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedWorkspaceShell>{children}</ProtectedWorkspaceShell>;
}
