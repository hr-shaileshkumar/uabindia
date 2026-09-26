"use client";

import * as React from "react";
import { Loader2, ChevronDown, Check, X } from "lucide-react";
import { useLookup, LookupItem } from "@/services/lookup";
import { cn } from "@/lib/utils";

export interface LookupSelectProps {
  dictionary: string;
  value?: string;
  onChange?: (value: string, item?: LookupItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  companyId?: string;
  parentId?: string;
  showCode?: boolean;
  id?: string;
  name?: string;
}

export const LookupSelect = React.forwardRef<HTMLSelectElement, LookupSelectProps>(
  (
    {
      dictionary,
      value = "",
      onChange,
      placeholder = "Select an option...",
      disabled = false,
      className,
      required = false,
      companyId,
      parentId,
      showCode = false,
      id,
      name,
    },
    ref
  ) => {
    const lookupQuery = React.useMemo(() => {
      if (!companyId && !parentId) return undefined;
      return {
        companyId: companyId || undefined,
        parentId: parentId || undefined,
      };
    }, [companyId, parentId]);

    const { items, loading, error } = useLookup(dictionary, lookupQuery);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedVal = e.target.value;
      const selectedItem = items.find((it) => it.id === selectedVal || it.code === selectedVal);
      onChange?.(selectedVal, selectedItem);
    };

    return (
      <div className={cn("relative w-full", className)}>
        <select
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          className={cn(
            "flex h-10 w-full appearance-none items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400",
            !value && "text-slate-400 dark:text-slate-500"
          )}
        >
          <option value="">{loading ? "Loading options..." : placeholder}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {showCode && item.code ? ` (${item.code})` : ""}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>
    );
  }
);

LookupSelect.displayName = "LookupSelect";

export default LookupSelect;
