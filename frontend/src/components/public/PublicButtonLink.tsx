"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { publicButtonClassName } from "@/components/public/publicStyles";

type PublicButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof publicButtonClassName;
  className?: string;
};

export default function PublicButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: PublicButtonLinkProps) {
  return (
    <Link href={href} className={`${publicButtonClassName[variant]} ${className}`.trim()}>
      {children}
    </Link>
  );
}
