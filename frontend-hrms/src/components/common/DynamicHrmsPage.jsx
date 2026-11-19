import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getHrmsSchema } from "../../metadata/hrmsCatalog";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";
import DataTable from "./DataTable";
import RecordDrawer from "./RecordDrawer";
import DynamicFormModal from "./DynamicFormModal";
import StatusBadge from "./StatusBadge";

export const DynamicHrmsPage = ({ pageKey, customSchema = null, children }) => {
  const schema = useMemo(
    () => customSchema || getHrmsSchema(pageKey),
    [pageKey, customSchema]
  );
  const { notifySuccess, notifyError } = useNotification();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  // Modal / Drawer state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const loadData = useCallback(async () => {
    if (!schema) return;
    setLoading(true);
    try {
      const records = await hrmsService.getGenericData(
        schema.pageKey,
        schema.apiEndpoint
      );
      setData(records);
    } catch (err) {
      console.error("Failed to load records", err);
      notifyError("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, [schema, notifyError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = Object.values(row).some((val) => {
          if (val == null) return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        const rowStatus = String(row.status || "").toLowerCase();
        if (rowStatus !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter]);

  const handleCreate = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setDrawerOpen(false);
    setFormOpen(true);
  };

  const handleDelete = async (record) => {
    const title = record.fullName || record.title || record.name || record.id;
    if (window.confirm(`Are you sure you want to remove ${title}?`)) {
      try {
        await hrmsService.deleteGenericRecord(
          schema.pageKey,
          schema.apiEndpoint,
          record.id
        );
        setData((prev) => prev.filter((r) => r.id !== record.id));
        notifySuccess(`${title} successfully removed`);
        if (selectedRecord?.id === record.id) {
          setDrawerOpen(false);
          setSelectedRecord(null);
        }
      } catch (err) {
        notifyError("Failed to delete record");
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const saved = await hrmsService.saveGenericRecord(
        schema.pageKey,
        schema.apiEndpoint,
        formData
      );
      setData((prev) => {
        const isEdit = Boolean(formData.id);
        if (isEdit) {
          return prev.map((r) => (r.id === saved.id ? { ...r, ...saved } : r));
        }
        return [saved, ...prev];
      });
      notifySuccess(
        `${schema.entityName || "Record"} saved successfully`
      );
    } catch (err) {
      notifyError("Failed to save record");
    }
  };

  const handleTransition = async (record, toState, action) => {
    try {
      const updated = { ...record, status: toState };
      await hrmsService.saveGenericRecord(
        schema.pageKey,
        schema.apiEndpoint,
        updated
      );
      setData((prev) =>
        prev.map((r) => (r.id === record.id ? updated : r))
      );
      setSelectedRecord(updated);
      notifySuccess(`Status transitioned to "${toState}"`);
    } catch (err) {
      notifyError("Failed to update status");
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const handleExportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = schema.columns.map((c) => c.label).join(",");
    const rows = filteredData
      .map((row) =>
        schema.columns
          .map((c) => {
            const val = row[c.key] ?? "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${schema.pageKey.replace(".", "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("CSV exported successfully");
  };

  if (!schema) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-800">Module Schema Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">PageKey: {pageKey}</p>
      </div>
    );
  }

  // Extract distinct statuses for filter
  const statusOptions = useMemo(() => {
    const fromSchema = schema.filters?.find((f) => f.key === "status")?.options;
    if (fromSchema) return fromSchema.map((o) => o.value);
    const set = new Set();
    data.forEach((r) => {
      if (r.status) set.add(r.status);
    });
    return Array.from(set);
  }, [schema, data]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              {schema.category || "HRMS"}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {schema.pageKey}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {schema.title}
          </h1>
          {schema.subTitle && (
            <p className="text-xs text-slate-400 mt-0.5">
              {schema.subTitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Data from Database"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New {schema.entityName || "Record"}
          </button>
        </div>
      </div>

      {/* KPI Tiles (if defined) */}
      {schema.kpis && schema.kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {schema.kpis.map((kpi, idx) => {
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-100 p-3 shadow-2xs"
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {kpi.key === "totalEmployees"
                    ? data.length
                    : kpi.key === "activeEmployees"
                    ? data.filter((d) => d.status === "Active").length
                    : kpi.value || "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Child View if passed */}
      {children}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/70 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${schema.entityName ? schema.entityName.toLowerCase() + "s" : "records"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Card Grid View"
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === "cards"
                  ? "bg-white text-blue-600 shadow-2xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Table or Cards */}
      {viewMode === "table" ? (
        <DataTable
          columns={schema.columns}
          data={filteredData}
          isLoading={loading}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyActionLabel={`+ Add ${schema.entityName || "Record"}`}
          onEmptyAction={handleCreate}
        />
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((row) => {
            const title =
              row.fullName || row.title || row.employeeName || row.name || row.id;
            const code =
              row.employeeCode || row.requisitionCode || row.candidateCode || row.shiftCode || row.code || row.id;

            return (
              <div
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {code}
                    </span>
                    <StatusBadge status={row.status} />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {title}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {row.designationName || row.appliedJob || row.departmentName || "Record"}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    {schema.columns.slice(2, 4).map((col) => (
                      <div key={col.key}>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          {col.label}
                        </div>
                        <div className="font-medium text-slate-700 truncate text-[11px]">
                          {String(row[col.key] ?? "—")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Inspector Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
        schema={schema}
        onEdit={handleEdit}
        onTransition={handleTransition}
      />

      {/* Add / Edit Form Modal */}
      <DynamicFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        schema={schema}
        initialData={editingRecord}
        onSave={handleSave}
      />
    </div>
  );
};

export default DynamicHrmsPage;
