"use client";

import type { ReactNode } from "react";
import { publicAuthInputIconClassName, publicAuthInputWithIconClassName, publicFormLabelClassName } from "@/components/public/publicStyles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PublicAuthFormFieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
};

export function PublicAuthFormField({
  id,
  label,
  error,
  hint,
  icon,
  trailing,
  children,
}: PublicAuthFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={publicFormLabelClassName}>
          {label}
        </label>
        {hint}
      </div>
      {children ?? (
        <div className="relative">
          {icon ? <span className={publicAuthInputIconClassName}>{icon}</span> : null}
          {trailing}
        </div>
      )}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

type PublicAuthInputProps = React.ComponentProps<typeof Input> & {
  icon?: ReactNode;
  trailing?: ReactNode;
};

export function PublicAuthInput({ icon, trailing, className, ...props }: PublicAuthInputProps) {
  return (
    <div className="relative">
      {icon ? <span className={publicAuthInputIconClassName}>{icon}</span> : null}
      <Input
        {...props}
        className={cn(
          publicAuthInputWithIconClassName,
          icon ? "!pl-10" : "pl-3",
          trailing && "!pr-10",
          className,
        )}
      />
      {trailing}
    </div>
  );
}
