"use client";

import type { MasterOption } from "../types";

export function ErpMasterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (id: string, option?: MasterOption) => void;
  options: MasterOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="erp-label">{label}</label>
      <select
        className="erp-select mt-1 cursor-pointer"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const id = event.target.value;
          onChange(id, options.find((option) => option.id === id));
        }}
      >
        <option value="">{placeholder || "Select…"}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.meta ? ` — ${option.meta}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
