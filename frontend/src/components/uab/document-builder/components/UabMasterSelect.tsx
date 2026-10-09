"use client";

import type { MasterOption } from "../types";

export function UabMasterSelect({
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
        id={`master-select-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        name={`master_select_${label.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
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

export const ErpMasterSelect = UabMasterSelect;
