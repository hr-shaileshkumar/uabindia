import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";

export const DynamicFormModal = ({
  isOpen,
  onClose,
  schema,
  initialData = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = schema?.form?.sections || [
    {
      key: "general",
      label: "General Information",
      fields: (schema?.columns || [])
        .filter((c) => c.key !== "id")
        .map((c) => ({
          key: c.key,
          label: c.label,
          type: c.type === "badge" ? "select" : c.type || "text",
          required: c.key === "fullName" || c.key === "name" || c.key === "title",
          span: 1,
        })),
    },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Set defaults from fields
      const defaults = {};
      sections.forEach((s) => {
        s.fields.forEach((f) => {
          if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
          else if (f.type === "boolean") defaults[f.key] = true;
        });
      });
      setFormData(defaults);
    }
    setErrors({});
    setActiveTab(0);
  }, [initialData, schema, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData?.id);
  const currentSection = sections[activeTab] || sections[0];

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate required fields across all sections
    sections.forEach((sec) => {
      sec.fields.forEach((field) => {
        if (field.required && (formData[field.key] == null || String(formData[field.key]).trim() === "")) {
          newErrors[field.key] = `${field.label} is required`;
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto-switch to the section containing the first error
      const firstErrKey = Object.keys(newErrors)[0];
      const errSectionIndex = sections.findIndex((s) =>
        s.fields.some((f) => f.key === firstErrKey)
      );
      if (errSectionIndex >= 0) setActiveTab(errSectionIndex);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isEdit ? `Edit ${schema?.entityName || "Record"}` : `Add New ${schema?.entityName || "Record"}`}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {schema?.subTitle || "Enter the details below to save into database."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Tabs (if multi-section) */}
        {sections.length > 1 && (
          <div className="flex border-b border-slate-100 px-4 bg-slate-50/40 overflow-x-auto">
            {sections.map((sec, idx) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`py-1.5 px-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === idx
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {currentSection.fields.map((field) => {
              const spanClass = field.span === 2 ? "col-span-2" : "col-span-1";
              const error = errors[field.key];
              const value = formData[field.key] ?? "";

              return (
                <div key={field.key} className={spanClass}>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>

                  {/* Input Rendering based on field.type */}
                  {field.type === "select" ? (
                    <select
                      value={value}
                      disabled={field.readOnly}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full h-8 px-2.5 py-1 text-xs bg-white border rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        error ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                      }`}
                    >
                      <option value="">Select option...</option>
                      {(field.options || []).map((opt) => (
                        <option key={opt.value || opt} value={opt.value || opt}>
                          {opt.label || opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={2}
                      value={value}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        error ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                      }`}
                    />
                  ) : field.type === "boolean" ? (
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id={field.key}
                        checked={Boolean(formData[field.key])}
                        onChange={(e) => handleChange(field.key, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-3.5 h-3.5"
                      />
                      <label htmlFor={field.key} className="text-xs text-slate-600 select-none">
                        Enabled / Active
                      </label>
                    </div>
                  ) : (
                    <input
                      type={
                        field.type === "number" || field.type === "currency"
                          ? "number"
                          : field.type === "date"
                          ? "date"
                          : field.type === "email"
                          ? "email"
                          : field.type === "tel"
                          ? "tel"
                          : "text"
                      }
                      value={value}
                      readOnly={field.readOnly}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full h-8 px-2.5 py-1 text-xs bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        field.readOnly ? "bg-slate-100 cursor-not-allowed opacity-80" : ""
                      } ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200"}`}
                    />
                  )}

                  {error && (
                    <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {Object.keys(errors).length > 0 && (
              <span className="text-rose-600 font-semibold">
                Please complete required fields.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-2xs shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : isEdit ? "Update Changes" : "Save Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicFormModal;
