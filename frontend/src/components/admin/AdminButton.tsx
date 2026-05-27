"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AdminButtonVariant;
};

const variantMap: Record<AdminButtonVariant, "default" | "secondary" | "destructive" | "ghost" | "success" | "warning"> = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
  ghost: "ghost",
  success: "success",
  warning: "warning",
};

export default function AdminButton({ children, variant = "primary", className, ...props }: Props) {
  return (
    <Button variant={variantMap[variant]} className={className} {...props}>
      {children}
    </Button>
  );
}
