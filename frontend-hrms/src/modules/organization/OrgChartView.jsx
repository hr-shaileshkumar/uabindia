import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, ChevronDown, ChevronRight, Mail, Phone, RefreshCw } from "lucide-react";
import apiClient from "../../api/client";
import hrmsService from "../../services/hrmsService";

export const OrgChartView = () => {
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchTree = async () => {
      try {
        const res = await apiClient.get("/hrms/organization/tree");
        if (mounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const transform = (node) => ({
            id: node.id,
            name: node.fullName,
            title: node.designationName || "Team Member",
            department: node.departmentName || "Engineering",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            children: (node.subordinates || []).map(transform),
          });
          setTreeData(transform(res.data[0]));
          setLoading(false);
          return;
        }
      } catch (err) {}

      // Build tree from employees list
      const employees = await hrmsService.getEmployees();
      if (mounted) {
        const rootEmp = employees[0] || {
          id: "ceo",
          fullName: "Siddharth Rao",
          designationName: "Chief Executive Officer & MD",
          departmentName: "Executive Leadership",
          avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        };

        const children = employees.slice(1, 5).map((e) => ({
          id: e.id,
          name: e.fullName,
          title: e.designationName || "Specialist",
          department: e.departmentName || "General",
          avatar: e.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          children: [],
        }));

        setTreeData({
          id: rootEmp.id,
          name: rootEmp.fullName,
          title: rootEmp.designationName || "Executive Leader",
          department: rootEmp.departmentName || "Leadership",
          avatar: rootEmp.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
          children,
        });
        setLoading(false);
      }
    };

    fetchTree();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleNode = (id) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node) => {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id];

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all w-48 text-center relative group">
          <img
            src={node.avatar}
            alt={node.name}
            className="w-9 h-9 rounded-full object-cover mx-auto ring-2 ring-blue-50 shadow-2xs mb-1.5"
          />
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
            {node.name}
          </h4>
          <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
            {node.title}
          </p>
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {node.department}
          </span>

          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-slate-300 hover:border-blue-600 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-2xs transition-colors"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isCollapsed ? "-rotate-90" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* Children Subtree */}
        {hasChildren && !isCollapsed && (
          <div className="pt-4 relative flex gap-4 before:absolute before:top-0 before:left-1/2 before:w-px before:h-4 before:bg-slate-300">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Reporting Hierarchy
            </span>
            <span className="text-xs text-slate-400 font-mono">hrms.org-chart</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Interactive Organization Chart
          </h1>
          <p className="text-xs text-slate-500">
            Hierarchical reporting structure from C-Suite down to operational team members.
          </p>
        </div>

        <Link
          to="/employees"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors shrink-0"
        >
          View as Directory List
        </Link>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs overflow-x-auto min-h-[420px] flex justify-center items-start">
        {loading ? (
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-12">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            Loading organization hierarchy tree...
          </div>
        ) : (
          renderNode(treeData)
        )}
      </div>
    </div>
  );
};

export default OrgChartView;
