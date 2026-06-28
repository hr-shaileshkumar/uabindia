"use client";

import type { ReactNode } from "react";

type PublicAuthShellProps = {
  children: ReactNode;
};

export default function PublicAuthShell({ children }: PublicAuthShellProps) {
  return (
    <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-[29rem]">{children}</div>
    </section>
  );
}
