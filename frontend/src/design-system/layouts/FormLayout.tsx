"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface FormSectionItem {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export interface FormLayoutProps {
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

export function FormLayout({
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
}: FormLayoutProps) {
  const currentTab = activeTab || sections[0]?.id;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Card */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}

        {sections.length > 1 && onTabChange ? (
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => onTabChange(sec.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  currentTab === sec.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {idx + 1}. {sec.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Form Render */}
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
            <div
              key={sec.id}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{sec.title}</h3>
                {sec.description ? <p className="text-xs text-slate-500 mt-0.5">{sec.description}</p> : null}
              </div>
              <div className="pt-1">{sec.children}</div>
            </div>
          ))}

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur-md pb-6 sm:pb-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="px-5">
            Cancel
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {onSaveDraft ? (
              <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={saving} className="px-4 text-xs">
                Save Draft
              </Button>
            ) : null}

            {onSaveAndContinue ? (
              <Button type="button" variant="outline" onClick={onSaveAndContinue} disabled={saving} className="px-4 text-xs">
                Save & Continue
              </Button>
            ) : null}

            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6">
              {saving ? "Saving..." : isEdit ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
