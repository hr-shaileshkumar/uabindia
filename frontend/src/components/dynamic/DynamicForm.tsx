"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  MapPin,
  CreditCard,
  Users,
  Calendar,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Save,
} from "lucide-react";
import { DynamicFieldInput, cleanFieldLabel } from "./DynamicFieldRegistry";
import { DynamicLineItemsEditor } from "./DynamicLineItemsEditor";
import { DynamicRecordAttachments, type RecordAttachment } from "./engine/DynamicRecordAttachments";
import { DynamicRecordTimeline, type TimelineEntry } from "./engine/DynamicRecordTimeline";
import { DynamicRecordWorkflowBar } from "./engine/DynamicRecordWorkflowBar";
import type { DynamicFormSection, DynamicFormField, DynamicWorkflowConfig, WorkflowTransition } from "@/lib/dynamic-schema/types";
import { notifyError } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/context/PermissionContext";
import { useAuth } from "@/context/AuthContext";

interface DynamicFormProps {
  sections: DynamicFormSection[];
  initialData?: Record<string, any> | null;
  onSubmit: (formData: Record<string, any>) => Promise<void> | void;
  onCancel: () => void;
  isSaving?: boolean;
  isEdit?: boolean;
  formId?: string;
  workflow?: DynamicWorkflowConfig;
  onWorkflowTransition?: (transition: WorkflowTransition, remarks?: string) => Promise<void> | void;
  hasAttachments?: boolean;
  hasTimeline?: boolean;
  attachments?: RecordAttachment[];
  onUploadAttachment?: (files: File[]) => Promise<void> | void;
  onDeleteAttachment?: (id: string) => Promise<void> | void;
  timelineEntries?: TimelineEntry[];
  onAddTimelineComment?: (comment: string) => Promise<void> | void;
}

function getTabIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("contact") || t.includes("address") || t.includes("location")) {
    return <MapPin className="h-3.5 w-3.5 shrink-0" />;
  }
  if (t.includes("financial") || t.includes("tax") || t.includes("bank") || t.includes("statutory") || t.includes("currency")) {
    return <CreditCard className="h-3.5 w-3.5 shrink-0" />;
  }
  if (t.includes("deployment") || t.includes("organization") || t.includes("role") || t.includes("team") || t.includes("hr")) {
    return <Users className="h-3.5 w-3.5 shrink-0" />;
  }
  if (t.includes("schedule") || t.includes("timeline") || t.includes("date")) {
    return <Calendar className="h-3.5 w-3.5 shrink-0" />;
  }
  if (t.includes("system") || t.includes("setting") || t.includes("audit") || t.includes("security")) {
    return <Settings className="h-3.5 w-3.5 shrink-0" />;
  }
  if (t.includes("general") || t.includes("identity") || t.includes("basic") || t.includes("company") || t.includes("master")) {
    return <Building2 className="h-3.5 w-3.5 shrink-0" />;
  }
  return <FileText className="h-3.5 w-3.5 shrink-0" />;
}

export function DynamicForm({
  sections,
  initialData,
  onSubmit,
  onCancel,
  isSaving = false,
  isEdit = false,
  formId = "dynamic-record-form",
  workflow,
  onWorkflowTransition,
  hasAttachments,
  hasTimeline,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  timelineEntries,
  onAddTimelineComment,
}: DynamicFormProps) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { user } = useAuth();

  // Intelligently partition single massive sections (e.g. fallback schemas) into logical tabs
  const effectiveSections = useMemo<DynamicFormSection[]>(() => {
    if (!sections || sections.length === 0) return [];

    // Blacklist technical/system fields that must NEVER be user-editable inputs
    const BLACKLISTED_FORM_KEYS = new Set([
      "id",
      "_id",
      "tenantid",
      "tenant_id",
      "tenant",
      "tenantcode",
      "tenant_code",
      "createdat",
      "created_at",
      "updatedat",
      "updated_at",
      "createdby",
      "created_by",
      "updatedby",
      "updated_by",
      "deletedat",
      "deletedby",
      "isdeleted",
      "rowversion",
      "passwordhash",
      "securitystamp",
      "concurrencystamp",
      "twofactorsecret",
      "refreshtoken",
      "refreshtokenexpiresat",
      "otp",
      "secret",
      "emailhash",
      "normalizedemail",
      "normalizedusername",
    ]);

    const isAutoCodeKey = (key: string) => {
      const k = key.toLowerCase();
      return (
        k === "code" ||
        k === "employeecode" ||
        k === "customercode" ||
        k === "vendorcode" ||
        k === "invoicenumber" ||
        k === "ordernumber" ||
        k === "documentnumber" ||
        k === "itemcode" ||
        k === "warehousecode" ||
        k === "departmentcode" ||
        k === "projectcode" ||
        k === "assetcode" ||
        k === "sonumber" ||
        k === "ponumber" ||
        k === "claimnumber" ||
        k === "requestnumber" ||
        k === "grnnumber" ||
        k === "returnnumber" ||
        k === "ticketnumber"
      );
    };

    const isFieldPermitted = (f: DynamicFormField): boolean => {
      if (isSuperAdmin) return true;
      if (f.requiredPermission && !hasPermission([f.requiredPermission])) {
        return false;
      }
      if (f.security?.restrictedPermissions && f.security.restrictedPermissions.length > 0) {
        if (!hasPermission(f.security.restrictedPermissions)) {
          return false;
        }
      }
      if (f.security?.restrictedRoles && f.security.restrictedRoles.length > 0) {
        const userRoles = user?.roles || (user?.role ? [user.role] : []);
        if (!userRoles.some((r) => f.security!.restrictedRoles!.includes(r))) {
          return false;
        }
      }
      return true;
    };

    // Sanitize sections: filter out blacklisted keys and configure auto-code fields
    const sanitizedSections = sections
      .map((sec) => ({
        ...sec,
        fields: (sec.fields || [])
          .filter((f) => !BLACKLISTED_FORM_KEYS.has(f.key.toLowerCase()) && isFieldPermitted(f))
          .map((f) => {
            if (isAutoCodeKey(f.key)) {
              return {
                ...f,
                readOnly: true,
                required: false,
                placeholder: !isEdit ? "⚡ Auto-generated on save" : undefined,
              };
            }
            return f;
          }),
      }))
      .filter((sec) => sec.fields.length > 0);

    if (sanitizedSections.length === 0) return [];
    if (sanitizedSections.length > 1) return sanitizedSections;

    const single = sanitizedSections[0];
    if (single.fields.length <= 6) return sanitizedSections;

    const generalFields: DynamicFormField[] = [];
    const contactFields: DynamicFormField[] = [];
    const financialFields: DynamicFormField[] = [];
    const settingsFields: DynamicFormField[] = [];

    for (const f of single.fields) {
      const k = f.key.toLowerCase();
      const t = f.fieldType.toLowerCase();

      if (
        k.includes("address") ||
        k.includes("city") ||
        k.includes("state") ||
        k.includes("country") ||
        k.includes("postal") ||
        k.includes("zip") ||
        k.includes("phone") ||
        k.includes("mobile") ||
        k.includes("email") ||
        k.includes("website") ||
        k.includes("contact")
      ) {
        contactFields.push(f);
      } else if (
        t === "currency" ||
        k.includes("tax") ||
        k.includes("gst") ||
        k.includes("pan") ||
        k.includes("bank") ||
        k.includes("ifsc") ||
        k.includes("iban") ||
        k.includes("swift") ||
        k.includes("routing") ||
        k.includes("salary") ||
        k.includes("amount") ||
        k.includes("price")
      ) {
        financialFields.push(f);
      } else if (
        t === "boolean" ||
        k.includes("status") ||
        k.includes("active") ||
        k.includes("system") ||
        k.includes("role")
      ) {
        settingsFields.push(f);
      } else {
        generalFields.push(f);
      }
    }

    const partitioned: DynamicFormSection[] = [];
    if (generalFields.length > 0) {
      partitioned.push({
        title: "General Information",
        description: "Configure core profile and identification details.",
        fields: generalFields,
        gridCols: single.gridCols || 2,
      });
    }
    if (contactFields.length > 0) {
      partitioned.push({
        title: "Contact & Address",
        description: "Operational address, location, and communication channels.",
        fields: contactFields,
        gridCols: single.gridCols || 2,
      });
    }
    if (financialFields.length > 0) {
      partitioned.push({
        title: "Financial & Statutory",
        description: "Banking details, tax identifiers, and fiscal settings.",
        fields: financialFields,
        gridCols: single.gridCols || 2,
      });
    }
    if (settingsFields.length > 0) {
      partitioned.push({
        title: "System & Settings",
        description: "Status flags, security attributes, and system controls.",
        fields: settingsFields,
        gridCols: single.gridCols || 2,
      });
    }

    if (partitioned.length === 0) return sanitizedSections;
    if (single.lineItems) {
      partitioned[partitioned.length - 1].lineItems = single.lineItems;
    }
    return partitioned;
  }, [sections, hasPermission, isSuperAdmin, user]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    for (const sec of effectiveSections) {
      for (const f of sec.fields) {
        if (initialData && initialData[f.key] !== undefined) {
          defaults[f.key] = initialData[f.key];
        } else if (f.defaultValue !== undefined) {
          defaults[f.key] = f.defaultValue;
        } else {
          defaults[f.key] = f.fieldType === "boolean" ? false : "";
        }
      }
    }
    return { ...defaults, ...(initialData || {}) };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      
      // Multi-level transitive dependency clearing (e.g. Country -> State -> District -> City)
      const clearedKeys = new Set<string>([key]);
      let addedAny = true;
      while (addedAny) {
        addedAny = false;
        for (const sec of effectiveSections) {
          for (const f of sec.fields) {
            if (f.dependsOn && clearedKeys.has(f.dependsOn) && !clearedKeys.has(f.key)) {
              clearedKeys.add(f.key);
              next[f.key] = "";
              addedAny = true;
            }
          }
        }
      }
      return next;
    });

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const evaluateSingleCondition = (expr: string): boolean => {
    expr = expr.trim();
    if (!expr) return true;

    // Negation check, e.g. "!taxExempt"
    if (expr.startsWith("!") && !expr.includes("==") && !expr.includes("!=") && !expr.includes(">") && !expr.includes("<")) {
      const field = expr.substring(1).trim();
      return !Boolean(formData[field]);
    }

    // Single field truthy check, e.g. "isActive"
    if (!expr.includes(" ") && !expr.includes("=") && !expr.includes(">") && !expr.includes("<")) {
      return Boolean(formData[expr]);
    }

    // Match: fieldName <operator> 'value' or number or boolean
    const match = expr.match(/^([a-zA-Z0-9_]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (!match) return true;

    const [, field, op, rawExpected] = match;
    const actualVal = formData[field];

    let expected: any = rawExpected.trim();
    if ((expected.startsWith("'") && expected.endsWith("'")) || (expected.startsWith('"') && expected.endsWith('"'))) {
      expected = expected.substring(1, expected.length - 1);
    } else if (expected === "true") {
      expected = true;
    } else if (expected === "false") {
      expected = false;
    } else if (expected === "null" || expected === "undefined") {
      expected = null;
    } else if (!isNaN(Number(expected)) && expected !== "") {
      expected = Number(expected);
    }

    const actualNormalized = typeof expected === "number" ? Number(actualVal) : actualVal;

    switch (op) {
      case "==":
        return actualNormalized == expected;
      case "!=":
        return actualNormalized != expected;
      case ">":
        return Number(actualNormalized) > Number(expected);
      case "<":
        return Number(actualNormalized) < Number(expected);
      case ">=":
        return Number(actualNormalized) >= Number(expected);
      case "<=":
        return Number(actualNormalized) <= Number(expected);
      default:
        return true;
    }
  };

  const evaluateCondition = (expression: string | undefined | null): boolean => {
    if (!expression || typeof expression !== "string" || !expression.trim()) return true;
    const expr = expression.trim();

    // Support compound OR (||)
    if (expr.includes("||")) {
      return expr.split("||").some((part) => evaluateCondition(part.trim()));
    }

    // Support compound AND (&&)
    if (expr.includes("&&")) {
      return expr.split("&&").every((part) => evaluateCondition(part.trim()));
    }

    return evaluateSingleCondition(expr);
  };

  const isFieldVisible = (f: DynamicFormField): boolean => {
    if (f.conditionalRules?.visibleWhen) {
      return evaluateCondition(f.conditionalRules.visibleWhen);
    }
    return true;
  };

  const isFieldRequired = (f: DynamicFormField): boolean => {
    if (f.conditionalRules?.requiredWhen) {
      return evaluateCondition(f.conditionalRules.requiredWhen);
    }
    return Boolean(f.required);
  };

  const isFieldDisabled = (f: DynamicFormField): boolean => {
    if (isSaving || f.readOnly) return true;
    if (f.conditionalRules?.disabledWhen) {
      return evaluateCondition(f.conditionalRules.disabledWhen);
    }
    if (f.conditionalRules?.readonlyWhen) {
      return evaluateCondition(f.conditionalRules.readonlyWhen);
    }
    return false;
  };

  const getSectionErrorsCount = (sec: DynamicFormSection) => {
    let count = 0;
    for (const f of sec.fields) {
      if (isFieldVisible(f) && errors[f.key]) count++;
    }
    return count;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: Record<string, string> = {};
    let firstErrorSecIndex = -1;

    effectiveSections.forEach((sec, secIdx) => {
      for (const f of sec.fields) {
        if (!isFieldVisible(f)) continue; // Skip hidden conditional fields
        const val = formData[f.key];

        // 1. Mandatory check (supports static required or conditional requiredWhen)
        if (isFieldRequired(f)) {
          if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} is required.`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 2. Email format validation
        if (f.fieldType === "email" && val && typeof val === "string" && val.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val.trim())) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must be a valid email address.`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 3. Phone format validation
        if (f.fieldType === "phone" && val && typeof val === "string" && val.trim()) {
          const cleanDigits = val.replace(/[^0-9]/g, "");
          if (cleanDigits.length < 7 || cleanDigits.length > 15) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must be a valid phone number (7-15 digits).`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 4. URL format validation
        if (f.fieldType === "url" && val && typeof val === "string" && val.trim()) {
          try {
            new URL(val.trim().startsWith("http") ? val.trim() : `https://${val.trim()}`);
          } catch {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must be a valid URL.`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 5. Indian PAN format validation
        const isPanField = f.key.toLowerCase() === "pan" || f.key.toLowerCase().endsWith("pannumber");
        if (isPanField && val && typeof val === "string" && val.trim()) {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
          if (!panRegex.test(val.trim())) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must be a valid 10-character PAN (e.g. ABCDE1234F).`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 6. Indian GSTIN format validation
        const isGstField = f.key.toLowerCase() === "gstin" || f.key.toLowerCase().endsWith("gstnumber");
        if (isGstField && val && typeof val === "string" && val.trim()) {
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
          if (!gstRegex.test(val.trim())) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            continue;
          }
        }

        // 7. Regex Pattern check
        if (f.validation?.pattern && typeof val === "string" && val.trim()) {
          try {
            const regex = new RegExp(f.validation.pattern);
            if (!regex.test(val.trim())) {
              newErrors[f.key] = f.validation.patternMessage || `${cleanFieldLabel(f.label)} format is invalid.`;
              if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            }
          } catch {
            // safe regex fallback
          }
        }

        // 8. Min boundary check
        if (f.validation?.min !== undefined && val !== undefined && val !== "") {
          if (f.fieldType === "number" || f.fieldType === "currency" || f.fieldType === "decimal") {
            const numVal = Number(val);
            if (!isNaN(numVal) && numVal < f.validation.min) {
              newErrors[f.key] = `${cleanFieldLabel(f.label)} must be at least ${f.validation.min}.`;
              if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            }
          } else if (typeof val === "string" && val.length < f.validation.min) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} must have at least ${f.validation.min} characters.`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
          }
        }

        // 9. Max boundary check
        if (f.validation?.max !== undefined && val !== undefined && val !== "") {
          if (f.fieldType === "number" || f.fieldType === "currency" || f.fieldType === "decimal") {
            const numVal = Number(val);
            if (!isNaN(numVal) && numVal > f.validation.max) {
              newErrors[f.key] = `${cleanFieldLabel(f.label)} cannot exceed ${f.validation.max}.`;
              if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
            }
          } else if (typeof val === "string" && val.length > f.validation.max) {
            newErrors[f.key] = `${cleanFieldLabel(f.label)} cannot exceed ${f.validation.max} characters.`;
            if (firstErrorSecIndex === -1) firstErrorSecIndex = secIdx;
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (firstErrorSecIndex !== -1 && firstErrorSecIndex !== activeTabIndex) {
        setActiveTabIndex(firstErrorSecIndex);
      }
      notifyError("Please correct the highlighted fields before submitting.");
      return;
    }

    const cleanPayload = { ...formData };
    
    // 1. Remove blacklisted technical/system properties
    const BLACKLIST_PROPS = [
      "id", "_id", "tenantId", "TenantId", "tenant_id", "tenant", "tenantCode",
      "createdAt", "created_at", "updatedAt", "updated_at", "createdBy", "created_by",
      "updatedBy", "updated_by", "deletedAt", "deletedBy", "isDeleted", "rowVersion"
    ];
    BLACKLIST_PROPS.forEach((p) => delete cleanPayload[p]);

    // 2. If creating, strip empty or placeholder auto-code keys so backend auto-generates them
    if (!isEdit) {
      const codeKeys = [
        "code", "employeeCode", "customerCode", "vendorCode", "invoiceNumber",
        "orderNumber", "documentNumber", "itemCode", "warehouseCode",
        "departmentCode", "projectCode", "assetCode", "soNumber", "poNumber",
        "claimNumber", "requestNumber", "grnNumber", "returnNumber", "ticketNumber"
      ];
      for (const k of codeKeys) {
        const val = String(cleanPayload[k] || "").trim();
        if (!val || val.includes("Auto-generated")) {
          delete cleanPayload[k];
        }
      }
    }

    await onSubmit(cleanPayload);
  };

  const currentTab = effectiveSections[activeTabIndex] || effectiveSections[0];
  const isFirstTab = activeTabIndex === 0;
  const isLastTab = activeTabIndex === effectiveSections.length - 1;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      {/* Workflow Transition Stepper & Action Bar */}
      {workflow && workflow.enabled && (
        <DynamicRecordWorkflowBar
          workflow={workflow}
          currentState={String(formData[workflow.stateField || "status"] || formData.status || workflow.initialState || "Draft")}
          onTransition={async (transition, remarks) => {
            if (onWorkflowTransition) {
              await onWorkflowTransition(transition, remarks);
            }
            setFormData((prev) => ({
              ...prev,
              [workflow.stateField || "status"]: transition.toState,
            }));
          }}
          disabled={isSaving}
        />
      )}

      {/* Enterprise Underline Tab Navigation Bar (Frappe / ERPNext Standard) */}
      {effectiveSections.length > 1 && (
        <div className="border-b border-slate-200 dark:border-slate-800">
          <nav className="-mb-px flex flex-wrap gap-1" aria-label="Form Tabs">
            {effectiveSections.map((sec, idx) => {
              const isActive = idx === activeTabIndex;
              const errCount = getSectionErrorsCount(sec);
              const cleanTitle = cleanFieldLabel(sec.title);

              return (
                <button
                  key={sec.title || idx}
                  type="button"
                  onClick={() => setActiveTabIndex(idx)}
                  className={cn(
                    "group relative inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                    isActive
                      ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300 font-bold"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  <span>{cleanTitle}</span>

                  {errCount > 0 ? (
                    <span
                      className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-700 dark:text-rose-400 animate-pulse"
                    >
                      <AlertCircle className="h-2.5 w-2.5" />
                      {errCount}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "ml-0.5 text-[10px] font-normal",
                        isActive ? "text-blue-600/70 dark:text-blue-400/70" : "text-slate-400 dark:text-slate-500"
                      )}
                    >
                      ({sec.fields.length})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Active Tab Document Body */}
      {currentTab && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {currentTab.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentTab.description}
            </p>
          )}

          {currentTab.fields.length > 0 && (
            <div
              className={`grid gap-5 ${
                currentTab.gridCols === 1
                  ? "grid-cols-1"
                  : currentTab.gridCols === 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : currentTab.gridCols === 4
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {currentTab.fields.map((field) => {
                if (!isFieldVisible(field)) return null;

                const colSpan = field.colSpan || (field.fieldType === "textarea" ? 2 : 1);
                const spanClass =
                  colSpan === 2
                    ? "sm:col-span-2"
                    : colSpan === 3
                    ? "sm:col-span-3"
                    : colSpan === 4
                    ? "sm:col-span-4"
                    : "col-span-1";

                const fieldRequired = isFieldRequired(field);
                const fieldDisabled = isFieldDisabled(field);

                return (
                  <div key={field.key} className={spanClass}>
                    <DynamicFieldInput
                      field={{
                        ...field,
                        required: fieldRequired,
                        readOnly: fieldDisabled,
                      }}
                      value={formData[field.key]}
                      onChange={(val) => handleFieldChange(field.key, val)}
                      error={errors[field.key]}
                      disabled={fieldDisabled}
                      formValues={formData}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {currentTab.lineItems && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <DynamicLineItemsEditor
                config={currentTab.lineItems}
                items={Array.isArray(formData[currentTab.lineItems.key]) ? formData[currentTab.lineItems.key] : []}
                disabled={isSaving}
                onChange={(updatedItems) => {
                  const key = currentTab.lineItems!.key;
                  const totalField = currentTab.lineItems!.totalComputedField;
                  setFormData((prev) => {
                    const next = { ...prev, [key]: updatedItems };
                    if (totalField) {
                      const sum = updatedItems.reduce((acc, row) => {
                        const val = parseFloat(row.total ?? row.lineTotal ?? row.amount ?? 0) || 0;
                        return acc + val;
                      }, 0);
                      next[totalField] = sum;
                    }
                    return next;
                  });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation Bar — Previous / Next only (Save/Cancel are in the document header) */}
      {effectiveSections.length > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <div>
            {!isFirstTab && (
              <button
                type="button"
                onClick={() => setActiveTabIndex((prev) => Math.max(prev - 1, 0))}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous Tab
              </button>
            )}
          </div>
          <div>
            {!isLastTab && (
              <button
                type="button"
                onClick={() => setActiveTabIndex((prev) => Math.min(prev + 1, effectiveSections.length - 1))}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Next Tab
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attachments Section */}
      {hasAttachments && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <DynamicRecordAttachments
            attachments={attachments}
            onUpload={onUploadAttachment}
            onDelete={onDeleteAttachment}
            readOnly={isSaving}
          />
        </div>
      )}

      {/* Record Activity & Timeline Section */}
      {hasTimeline && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <DynamicRecordTimeline
            recordTitle={String(formData.name || formData.fullName || formData.title || "Record")}
            entries={timelineEntries || []}
            onAddComment={onAddTimelineComment}
          />
        </div>
      )}

      {/* Footer Form Action Bar: Cancel & Save/Update buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>{isEdit ? "Update Record" : "Save Record"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
