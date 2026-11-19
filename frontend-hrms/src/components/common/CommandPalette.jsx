import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Users, LayoutDashboard, Calendar, Clock, CreditCard, X } from "lucide-react";
import { NAVIGATION_SECTIONS } from "../../metadata/navigation";
import { INITIAL_EMPLOYEES } from "../../services/mockData";

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allNavItems = useMemo(() => {
    const items = [];
    NAVIGATION_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => {
        items.push({
          type: "page",
          category: sec.title,
          title: item.title,
          path: item.path,
          icon: item.icon,
        });
      });
    });
    return items;
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allNavItems.slice(0, 8);
    const q = query.toLowerCase();

    // 1. Pages
    const pages = allNavItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );

    // 2. Employees matching
    const employees = INITIAL_EMPLOYEES.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q)
    ).map((e) => ({
      type: "employee",
      category: "Employee Directory",
      title: `${e.fullName} (${e.employeeCode})`,
      subtitle: `${e.designationName} • ${e.departmentName}`,
      path: `/employees/360?id=${e.id}`,
      icon: Users,
    }));

    return [...pages, ...employees].slice(0, 10);
  }, [query, allNavItems]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, jump to a page, or search an employee..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching pages or employees found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon || ArrowRight;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.subtitle || item.category}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or enter key</span>
          <span>Uabindia HRMS Client Engine</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
