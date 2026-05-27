"use client";

interface SelectionCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

/** Row-level selection checkbox with ERP styling */
export function SelectionCheckbox({ checked, onChange, label }: SelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label ?? "Select row"}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
    />
  );
}
