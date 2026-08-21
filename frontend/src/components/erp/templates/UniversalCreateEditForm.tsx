"use client";

import type { ReactNode } from "react";
import { erpButtonClassName, erpPanelClassName } from "@/components/erp/erpStyles";

export interface FormSectionItem {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export interface UniversalCreateEditFormProps {
  title: string;
  subtitle?: string;
  sections: FormSectionItem[];
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  onSaveDraft?: () => Promise<void> | void;
  onSaveAndContinue?: () => Promise<void> | void;
  saving?: boolean;
  isEdit?: boolean;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function UniversalCreateEditForm({
  title,
  subtitle,
  sections,
  onSubmit,
  onCancel,
  onSaveDraft,
  onSaveAndContinue,
  saving = false,
  isEdit = false,
  activeTab,
  onTabChange,
}: UniversalCreateEditFormProps) {
  const currentTab = activeTab || sections[0]?.id;

  return (
    <div className="space-y-6 pb-12">
      <div className={`${erpPanelClassName} p-5`}>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}

        {sections.length > 1 && onTabChange ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => onTabChange(sec.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  currentTab === sec.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {idx + 1}. {sec.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit();
        }}
        className="space-y-6"
      >
        {sections
          .filter((sec) => !onTabChange || sec.id === currentTab)
          .map((sec) => (
            <div key={sec.id} className={`${erpPanelClassName} space-y-4 p-6`}>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                {sec.description ? <p className="mt-0.5 text-xs text-slate-500">{sec.description}</p> : null}
              </div>
              <div className="pt-1">{sec.children}</div>
            </div>
          ))}

        <div className="sticky bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 pb-6 shadow-lg backdrop-blur-md sm:pb-4">
          <button type="button" onClick={onCancel} disabled={saving} className={erpButtonClassName.secondary}>
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onSaveDraft ? (
              <button type="button" onClick={onSaveDraft} disabled={saving} className={`${erpButtonClassName.ghost} text-xs`}>
                Save Draft
              </button>
            ) : null}

            {onSaveAndContinue ? (
              <button type="button" onClick={onSaveAndContinue} disabled={saving} className={`${erpButtonClassName.secondary} text-xs`}>
                Save & Continue
              </button>
            ) : null}

            <button type="submit" disabled={saving} className={erpButtonClassName.primary}>
              {saving ? "Saving..." : isEdit ? "Update Record" : "Save Record"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
