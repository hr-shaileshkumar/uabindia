"use client";

import { useEffect, useRef } from "react";

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}

/** Header-level select-all checkbox with indeterminate state support */
export function SelectAllCheckbox({ checked, indeterminate, onChange }: SelectAllCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all rows"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
    />
  );
}
