import React, { useState } from "react";
import { Building2, Briefcase, Award, Users } from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";

export const OrgStructure = () => {
  const [activeTab, setActiveTab] = useState("departments");

  const tabs = [
    { id: "departments", label: "Departments", icon: Building2, pageKey: "hrms.departments" },
    { id: "designations", label: "Designations", icon: Briefcase, pageKey: "hrms.designations" },
    { id: "grades", label: "Grade Master", icon: Award, pageKey: "hrms.grades" },
    { id: "employment-types", label: "Employment Types", icon: Users, pageKey: "hrms.employment-types" },
  ];

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Master Table Page */}
      {tabs.map((tab) =>
        activeTab === tab.id ? (
          <DynamicHrmsPage key={tab.id} pageKey={tab.pageKey} />
        ) : null
      )}
    </div>
  );
};

export default OrgStructure;
