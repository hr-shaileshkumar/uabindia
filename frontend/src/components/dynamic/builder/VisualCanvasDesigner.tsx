"use client";

import React, { useState } from "react";
import {
  Type,
  Hash,
  DollarSign,
  Calendar,
  ToggleLeft,
  ListFilter,
  Search,
  AlignLeft,
  Mail,
  Phone,
  Tag,
  Plus,
  Trash2,
  GripVertical,
  Sliders,
  Columns,
  Sparkles,
  Layers,
  Calculator,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Check,
  LayoutGrid,
} from "lucide-react";
import type {
  DynamicFormField,
  DynamicFormSection,
  DynamicPageSchema,
  DynamicFieldType,
} from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

interface VisualCanvasDesignerProps {
  schema: DynamicPageSchema;
  onChange: (updatedSchema: DynamicPageSchema) => void;
  availableDbFields?: any[];
}

interface PaletteItem {
  type: DynamicFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "input" | "numeric" | "date" | "choice" | "advanced";
  defaultSpan?: 1 | 2 | 3 | 4;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: "text", label: "Text Input", icon: Type, category: "input", defaultSpan: 1 },
  { type: "textarea", label: "Multi-line Text", icon: AlignLeft, category: "input", defaultSpan: 2 },
  { type: "email", label: "Email Address", icon: Mail, category: "input", defaultSpan: 1 },
  { type: "phone", label: "Phone Number", icon: Phone, category: "input", defaultSpan: 1 },
  { type: "number", label: "Integer / Count", icon: Hash, category: "numeric", defaultSpan: 1 },
  { type: "currency", label: "Currency (₹ / $)", icon: DollarSign, category: "numeric", defaultSpan: 1 },
  { type: "date", label: "Date Picker", icon: Calendar, category: "date", defaultSpan: 1 },
  { type: "datetime", label: "Date & Time", icon: Calendar, category: "date", defaultSpan: 1 },
  { type: "select", label: "Dropdown Select", icon: ListFilter, category: "choice", defaultSpan: 1 },
  { type: "lookup", label: "Lookup Reference", icon: Search, category: "choice", defaultSpan: 1 },
  { type: "boolean", label: "Toggle / Checkbox", icon: ToggleLeft, category: "choice", defaultSpan: 1 },
  { type: "status", label: "Status Badge", icon: Tag, category: "choice", defaultSpan: 1 },
];

export function VisualCanvasDesigner({
  schema,
  onChange,
  availableDbFields = [],
}: VisualCanvasDesignerProps) {
  // Selected Field / Section for Property Inspector
  const [selectedFieldRef, setSelectedFieldRef] = useState<{
    sectionIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Dragging states
  const [draggedPaletteItem, setDraggedPaletteItem] = useState<PaletteItem | null>(null);
  const [draggedExistingField, setDraggedExistingField] = useState<{
    sectionIndex: number;
    fieldIndex: number;
  } | null>(null);
  const [dragOverSection, setDragOverSection] = useState<number | null>(null);
  const [dragOverFieldIdx, setDragOverFieldIdx] = useState<number | null>(null);

  // Active selected field object
  const activeSelectedField: DynamicFormField | null =
    selectedFieldRef &&
    schema.form?.sections[selectedFieldRef.sectionIndex]?.fields[selectedFieldRef.fieldIndex]
      ? schema.form.sections[selectedFieldRef.sectionIndex].fields[selectedFieldRef.fieldIndex]
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  // Schema Mutation Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const updateSection = (
    sectionIndex: number,
    updater: (sec: DynamicFormSection) => DynamicFormSection
  ) => {
    const sections = [...(schema.form?.sections || [])];
    if (sections[sectionIndex]) {
      sections[sectionIndex] = updater(sections[sectionIndex]);
      onChange({
        ...schema,
        form: { ...schema.form, sections },
      });
    }
  };

  const addSection = () => {
    const newSection: DynamicFormSection = {
      title: `Section ${(schema.form?.sections?.length || 0) + 1}`,
      description: "Configure attributes for this section.",
      gridCols: 2,
      fields: [],
    };
    onChange({
      ...schema,
      form: {
        ...schema.form,
        sections: [...(schema.form?.sections || []), newSection],
      },
    });
  };

  const deleteSection = (index: number) => {
    const sections = (schema.form?.sections || []).filter((_, i) => i !== index);
    setSelectedFieldRef(null);
    onChange({
      ...schema,
      form: { ...schema.form, sections },
    });
  };

  const addFieldToSection = (
    sectionIndex: number,
    fieldType: DynamicFieldType,
    fieldLabel?: string,
    insertAtIndex?: number
  ) => {
    const baseKey = fieldLabel
      ? fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, "")
      : `${fieldType}${Date.now().toString().slice(-4)}`;

    const newField: DynamicFormField = {
      key: baseKey,
      label: fieldLabel || `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}`,
      fieldType,
      required: false,
      colSpan: fieldType === "textarea" ? 2 : 1,
      placeholder: `Enter ${fieldLabel || fieldType}…`,
    };

    updateSection(sectionIndex, (sec) => {
      const fields = [...sec.fields];
      if (insertAtIndex !== undefined && insertAtIndex >= 0) {
        fields.splice(insertAtIndex, 0, newField);
      } else {
        fields.push(newField);
      }
      return { ...sec, fields };
    });

    const targetIdx = insertAtIndex !== undefined && insertAtIndex >= 0
      ? insertAtIndex
      : (schema.form?.sections[sectionIndex]?.fields.length || 0);

    setSelectedFieldRef({ sectionIndex, fieldIndex: targetIdx });
  };

  const deleteField = (sectionIndex: number, fieldIndex: number) => {
    updateSection(sectionIndex, (sec) => {
      const fields = sec.fields.filter((_, idx) => idx !== fieldIndex);
      return { ...sec, fields };
    });
    if (
      selectedFieldRef?.sectionIndex === sectionIndex &&
      selectedFieldRef.fieldIndex === fieldIndex
    ) {
      setSelectedFieldRef(null);
    }
  };

  const updateSelectedField = (updater: (prev: DynamicFormField) => DynamicFormField) => {
    if (!selectedFieldRef) return;
    const { sectionIndex, fieldIndex } = selectedFieldRef;
    updateSection(sectionIndex, (sec) => {
      const fields = [...sec.fields];
      if (fields[fieldIndex]) {
        fields[fieldIndex] = updater(fields[fieldIndex]);
      }
      return { ...sec, fields };
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Drag and Drop Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handlePaletteDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
    setDraggedPaletteItem(item);
    setDraggedExistingField(null);
  };

  const handleExistingFieldDragStart = (
    e: React.DragEvent,
    sectionIndex: number,
    fieldIndex: number
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ fromSection: sectionIndex, fromField: fieldIndex })
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggedExistingField({ sectionIndex, fieldIndex });
    setDraggedPaletteItem(null);
  };

  const handleDragOver = (e: React.DragEvent, secIdx: number, fIdx?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedPaletteItem ? "copy" : "move";
    setDragOverSection(secIdx);
    setDragOverFieldIdx(fIdx ?? null);
  };

  const handleDrop = (e: React.DragEvent, targetSecIdx: number, targetFieldIdx?: number) => {
    e.preventDefault();
    setDragOverSection(null);
    setDragOverFieldIdx(null);

    // 1. Dropping from Palette
    if (draggedPaletteItem) {
      addFieldToSection(targetSecIdx, draggedPaletteItem.type, undefined, targetFieldIdx);
      setDraggedPaletteItem(null);
      return;
    }

    // 2. Reordering existing field
    if (draggedExistingField) {
      const { sectionIndex: fromSec, fieldIndex: fromField } = draggedExistingField;
      if (fromSec === targetSecIdx && fromField === targetFieldIdx) return;

      const sourceSec = schema.form?.sections[fromSec];
      if (!sourceSec) return;

      const fieldToMove = sourceSec.fields[fromField];
      if (!fieldToMove) return;

      if (fromSec === targetSecIdx) {
        // Same section reorder
        updateSection(fromSec, (sec) => {
          const fields = [...sec.fields];
          fields.splice(fromField, 1);
          const insertIdx = targetFieldIdx !== undefined ? targetFieldIdx : fields.length;
          fields.splice(insertIdx, 0, fieldToMove);
          return { ...sec, fields };
        });
      } else {
        // Move across sections
        const updatedSections = [...(schema.form?.sections || [])];
        const newFromFields = updatedSections[fromSec].fields.filter((_, i) => i !== fromField);
        updatedSections[fromSec] = { ...updatedSections[fromSec], fields: newFromFields };

        const newToFields = [...updatedSections[targetSecIdx].fields];
        const insertIdx = targetFieldIdx !== undefined ? targetFieldIdx : newToFields.length;
        newToFields.splice(insertIdx, 0, fieldToMove);
        updatedSections[targetSecIdx] = { ...updatedSections[targetSecIdx], fields: newToFields };

        onChange({
          ...schema,
          form: { ...schema.form, sections: updatedSections },
        });
      }

      setDraggedExistingField(null);
    }
  };

  return (
    <div className="flex h-[800px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      {/* ─────────────────────────────────────────────────────────────────────
          LEFT PANE: Component & Field Palette
          ───────────────────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white p-4 flex flex-col justify-between overflow-y-auto dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <LayoutGrid className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Component Palette
            </h3>
          </div>

          <p className="text-[11px] text-slate-500">
            Drag controls into the canvas or click to add to the active section.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PALETTE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handlePaletteDragStart(e, item)}
                  onClick={() => {
                    const secIdx = selectedFieldRef?.sectionIndex ?? 0;
                    if ((schema.form?.sections?.length || 0) === 0) {
                      addSection();
                    }
                    addFieldToSection(secIdx, item.type);
                  }}
                  className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-indigo-950/30 cursor-grab active:cursor-grabbing transition-all text-center"
                >
                  <Icon className="h-4 w-4 text-slate-600 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Database Discovered Fields */}
          {availableDbFields.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Discovered DB Fields ({availableDbFields.length})
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {availableDbFields.map((f: any) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      const secIdx = selectedFieldRef?.sectionIndex ?? 0;
                      if ((schema.form?.sections?.length || 0) === 0) addSection();
                      addFieldToSection(secIdx, f.type || "text", f.label);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-100 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 text-left transition-colors"
                  >
                    <span className="truncate font-medium">{f.label}</span>
                    <span className="text-[9px] font-mono text-slate-400 ml-1">{f.key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Section */}
        <button
          type="button"
          onClick={addSection}
          className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-300 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New Section
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CENTER PANE: Visual Drag-and-Drop Canvas
          ───────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/60 dark:bg-slate-950">
        {/* Page Canvas Header Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {schema.entityName}
                </span>
                <span className="font-mono text-xs text-slate-400">/{schema.pageKey}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                {schema.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{schema.subTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Live Visual Canvas
              </span>
            </div>
          </div>
        </div>

        {/* Canvas Form Sections */}
        {schema.form?.sections?.map((section, secIdx) => {
          const gridCols = section.gridCols || 2;
          const isDragOverSection = dragOverSection === secIdx;

          return (
            <div
              key={secIdx}
              onDragOver={(e) => handleDragOver(e, secIdx)}
              onDrop={(e) => handleDrop(e, secIdx)}
              className={cn(
                "rounded-2xl border transition-all bg-white p-5 shadow-xs dark:bg-slate-900 relative",
                isDragOverSection
                  ? "border-indigo-500 ring-2 ring-indigo-400/20 bg-indigo-50/10 dark:bg-indigo-950/10"
                  : "border-slate-200 dark:border-slate-800"
              )}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    {secIdx + 1}
                  </span>
                  <div>
                    <input
                      id={`canvas-section-title-${secIdx}`}
                      name={`canvas_section_title_${secIdx}`}
                      value={section.title}
                      onChange={(e) =>
                        updateSection(secIdx, (s) => ({ ...s, title: e.target.value }))
                      }
                      className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {section.description || "Section attributes"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Grid Columns Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {[1, 2, 3, 4].map((cols) => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() =>
                          updateSection(secIdx, (s) => ({
                            ...s,
                            gridCols: cols as 1 | 2 | 3 | 4,
                          }))
                        }
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                          gridCols === cols
                            ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-900 dark:text-indigo-400"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        )}
                      >
                        {cols} Col{cols > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSection(secIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid Canvas Fields */}
              <div
                className={cn(
                  "grid gap-3 min-h-[100px] p-2 rounded-xl border border-dashed",
                  gridCols === 1 && "grid-cols-1",
                  gridCols === 2 && "grid-cols-1 sm:grid-cols-2",
                  gridCols === 3 && "grid-cols-1 sm:grid-cols-3",
                  gridCols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
                  section.fields.length === 0
                    ? "border-indigo-300/70 bg-indigo-50/20 dark:border-indigo-800/40 dark:bg-indigo-950/10 items-center justify-center text-center"
                    : "border-transparent"
                )}
              >
                {section.fields.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Drop fields here from the left palette
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Drag any control to place it into this section.
                    </p>
                  </div>
                ) : (
                  section.fields.map((field, fIdx) => {
                    const isSelected =
                      selectedFieldRef?.sectionIndex === secIdx &&
                      selectedFieldRef.fieldIndex === fIdx;

                    const colSpan = field.colSpan || 1;
                    const spanClass =
                      colSpan === 2
                        ? "sm:col-span-2"
                        : colSpan === 3
                        ? "sm:col-span-3"
                        : colSpan === 4
                        ? "sm:col-span-4"
                        : "col-span-1";

                    return (
                      <div
                        key={field.key + fIdx}
                        draggable
                        onDragStart={(e) => handleExistingFieldDragStart(e, secIdx, fIdx)}
                        onDragOver={(e) => handleDragOver(e, secIdx, fIdx)}
                        onDrop={(e) => handleDrop(e, secIdx, fIdx)}
                        onClick={() =>
                          setSelectedFieldRef({ sectionIndex: secIdx, fieldIndex: fIdx })
                        }
                        className={cn(
                          spanClass,
                          "group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/20"
                            : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 cursor-grab active:cursor-grabbing" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                {field.label}
                                {field.required && (
                                  <span className="text-rose-500 font-bold">*</span>
                                )}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {field.key}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 uppercase tracking-wider dark:bg-slate-700 dark:text-slate-300">
                              {field.fieldType}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(secIdx, fIdx);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dummy Input Visual Mockup */}
                        <div className="mt-2.5">
                          <div className="h-7 w-full rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[11px] text-slate-400 dark:border-slate-700/60 dark:bg-slate-900 flex items-center justify-between">
                            <span className="truncate">
                              {field.placeholder || `Enter ${field.label}…`}
                            </span>
                            {field.fieldType === "lookup" && (
                              <Search className="h-3 w-3 text-slate-400" />
                            )}
                            {field.fieldType === "select" && (
                              <ChevronDown className="h-3 w-3 text-slate-400" />
                            )}
                            {field.fieldType === "date" && (
                              <Calendar className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Line Items Embedded Section if Present */}
              {section.lineItems && (
                <div className="mt-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 dark:border-indigo-900 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {section.lineItems.title} (Dynamic Line Items Table)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600">
                      key: {section.lineItems.key}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Columns: {section.lineItems.columns?.map((c) => c.label).join(", ")}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Big Add Section Button */}
        <button
          type="button"
          onClick={addSection}
          className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition-all dark:border-slate-800 dark:bg-slate-900/30 dark:hover:border-indigo-700"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-bold">Add Another Form Section</span>
          <span className="text-[11px] text-slate-400">Organize fields into clear logical groups</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          RIGHT PANE: Live Property Inspector
          ───────────────────────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-white p-5 overflow-y-auto dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Property Inspector
            </h3>
          </div>
          {activeSelectedField && (
            <button
              type="button"
              onClick={() => setSelectedFieldRef(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {activeSelectedField ? (
          <div className="space-y-4 text-xs">
            {/* Field Label */}
            <div>
              <label htmlFor="designer-field-label" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Label *
              </label>
              <input
                id="designer-field-label"
                name="designer_field_label"
                type="text"
                value={activeSelectedField.label}
                onChange={(e) => {
                  const val = e.target.value;
                  updateSelectedField((f) => ({ ...f, label: val }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Field Key */}
            <div>
              <label htmlFor="designer-field-key" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Field Key (camelCase) *
              </label>
              <input
                id="designer-field-key"
                name="designer_field_key"
                type="text"
                value={activeSelectedField.key}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                  updateSelectedField((f) => ({ ...f, key: val }));
                }}
                className="w-full font-mono rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Field Type */}
            <div>
              <label htmlFor="designer-field-type" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Field Control Type
              </label>
              <select
                id="designer-field-type"
                name="designer_field_type"
                value={activeSelectedField.fieldType}
                onChange={(e) => {
                  const newType = e.target.value as DynamicFieldType;
                  updateSelectedField((f) => ({ ...f, fieldType: newType }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                {PALETTE_ITEMS.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label} ({item.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Grid Column Span */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Visual Column Span
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((span) => (
                  <button
                    key={span}
                    type="button"
                    onClick={() =>
                      updateSelectedField((f) => ({
                        ...f,
                        colSpan: span as 1 | 2 | 3 | 4,
                      }))
                    }
                    className={cn(
                      "py-1 text-center rounded-lg border text-[11px] font-bold transition-all",
                      (activeSelectedField.colSpan || 1) === span
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-400"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                    )}
                  >
                    Span {span}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Required Field
                </span>
                <input
                  id="designer-field-required"
                  name="designer_field_required"
                  type="checkbox"
                  checked={Boolean(activeSelectedField.required)}
                  onChange={(e) =>
                    updateSelectedField((f) => ({ ...f, required: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Read Only</span>
                <input
                  id="designer-field-readonly"
                  name="designer_field_readonly"
                  type="checkbox"
                  checked={Boolean(activeSelectedField.readOnly)}
                  onChange={(e) =>
                    updateSelectedField((f) => ({ ...f, readOnly: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>

            {/* Placeholder & Help Text */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label htmlFor="designer-field-placeholder" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Placeholder Text
                </label>
                <input
                  id="designer-field-placeholder"
                  name="designer_field_placeholder"
                  type="text"
                  value={activeSelectedField.placeholder || ""}
                  onChange={(e) =>
                    updateSelectedField((f) => ({ ...f, placeholder: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label htmlFor="designer-field-helptext" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Help / Tooltip Text
                </label>
                <input
                  id="designer-field-helptext"
                  name="designer_field_helptext"
                  type="text"
                  value={activeSelectedField.helpText || ""}
                  onChange={(e) =>
                    updateSelectedField((f) => ({ ...f, helpText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Lookup Specific Settings */}
            {activeSelectedField.fieldType === "lookup" && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Search className="h-3 w-3" /> Lookup API Source
                </span>

                <div>
                  <label htmlFor="designer-lookup-endpoint" className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    API Endpoint
                  </label>
                  <input
                    id="designer-lookup-endpoint"
                    name="designer_lookup_endpoint"
                    type="text"
                    value={activeSelectedField.optionsEndpoint || ""}
                    placeholder="/api/v1/dynamic-entities/Department"
                    onChange={(e) =>
                      updateSelectedField((f) => ({
                        ...f,
                        optionsEndpoint: e.target.value,
                      }))
                    }
                    className="w-full font-mono text-[11px] rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="designer-lookup-valkey" className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Value Key
                    </label>
                    <input
                      id="designer-lookup-valkey"
                      name="designer_lookup_valkey"
                      type="text"
                      value={activeSelectedField.lookupValueKey || "id"}
                      onChange={(e) =>
                        updateSelectedField((f) => ({
                          ...f,
                          lookupValueKey: e.target.value,
                        }))
                      }
                      className="w-full font-mono text-[11px] rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="designer-lookup-labelkey" className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Label Key
                    </label>
                    <input
                      id="designer-lookup-labelkey"
                      name="designer_lookup_labelkey"
                      type="text"
                      value={activeSelectedField.lookupLabelKey || "name"}
                      onChange={(e) =>
                        updateSelectedField((f) => ({
                          ...f,
                          lookupLabelKey: e.target.value,
                        }))
                      }
                      className="w-full font-mono text-[11px] rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Validation Rules */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="font-bold text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Validation Constraints
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="designer-validation-min" className="block text-[10px] text-slate-500 mb-0.5">Min Value / Len</label>
                  <input
                    id="designer-validation-min"
                    name="designer_validation_min"
                    type="number"
                    value={activeSelectedField.validation?.min ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Number(e.target.value);
                      updateSelectedField((f) => ({
                        ...f,
                        validation: { ...f.validation, min: val },
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="designer-validation-max" className="block text-[10px] text-slate-500 mb-0.5">Max Value / Len</label>
                  <input
                    id="designer-validation-max"
                    name="designer_validation_max"
                    type="number"
                    value={activeSelectedField.validation?.max ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? undefined : Number(e.target.value);
                      updateSelectedField((f) => ({
                        ...f,
                        validation: { ...f.validation, max: val },
                      }));
                    }}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
              No Field Selected
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
              Click any field on the canvas to configure its properties, validations, and options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
