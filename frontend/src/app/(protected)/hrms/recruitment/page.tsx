"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import {
  mapJobPosting,
  recruitmentJobPostingsQueryKey,
  useRecruitmentJobPostings,
} from "@/features/hrms/hooks/useRecruitmentJobPostings";
import { hrmsApi } from "@/services/modules/hrms";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type JobPostingRow = ReturnType<typeof mapJobPosting>;

const emptyForm = () => {
  const closing = new Date();
  closing.setDate(closing.getDate() + 30);
  return {
    title: "",
    description: "",
    department: "",
    location: "",
    level: "MidLevel",
    jobType: "FullTime",
    minSalary: "0",
    maxSalary: "0",
    closingDate: closing.toISOString().slice(0, 10),
    numberOfPositions: "1",
    requiredSkills: "",
  };
};

export default function RecruitmentAtsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useRecruitmentJobPostings(1, 50);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewRow, setViewRow] = useState<JobPostingRow | null>(null);
  const [form, setForm] = useState(emptyForm());

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => hrmsApi.recruitment.createJobPosting(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recruitmentJobPostingsQueryKey(1, 50) });
    },
  });

  const postings = useMemo(() => (data?.jobPostings ?? []).map(mapJobPosting), [data?.jobPostings]);
  const filtered = useMemo(
    () =>
      postings.filter((p) => {
        const q = search.toLowerCase();
        return !q || p.title.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
      }),
    [postings, search],
  );

  const openCreate = () => {
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    if (
      form.title.trim().length < 3 ||
      form.description.trim().length < 20 ||
      !form.department.trim() ||
      !form.location.trim() ||
      !form.closingDate
    ) {
      notifyError("Title (3+), description (20+), department, location, and closing date are required.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        level: form.level,
        jobType: form.jobType,
        minSalary: Number(form.minSalary) || 0,
        maxSalary: Number(form.maxSalary) || 0,
        closingDate: form.closingDate,
        numberOfPositions: Number(form.numberOfPositions) || 1,
        requiredSkills: form.requiredSkills.trim() || undefined,
      });
      notifySuccess("Job posting created as Draft.");
      setDrawerOpen(false);
      setForm(emptyForm());
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create job posting."));
    }
  };

  const list = useErpListView({
    listKey: "hrms-recruitment",
    rows: filtered,
    columns: [
      { key: "title", label: "Job Title" },
      { key: "department", label: "Department" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "No job postings found. Create a posting to start hiring.",
    onCreate: openCreate,
    createLabel: "New posting",
    onRefresh: () => void refetch(),
    extraFilters: (
      <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter job title or department…" />
    ),
    renderRow: (p) => (
      <tr key={p.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName} text-xs font-semibold text-slate-900`}>{p.title}</td>
        <td className={`${erpTableTdClassName} text-xs`}>{p.department}</td>
        <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{p.location}</td>
        <td className={erpTableTdClassName}>
          <span className={p.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
            {p.status}
          </span>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions onView={{ label: "View", onClick: () => setViewRow(p) }} />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Recruitment & Openings"
      subtitle="Manage job postings, candidate pipelines, applications, and hiring stages."
      eyebrow="HRMS / Talent Acquisition"
      icon="users"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Postings", value: data?.total ?? postings.length },
            { label: "Active", value: postings.filter((p) => p.status === "Active").length, tone: "positive" },
            { label: "Departments", value: new Set(postings.map((p) => p.department)).size, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          {list.headerTools}
          <ErpCreateButton label="New posting" onClick={openCreate} />
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load job postings.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Job posting details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Title</label>
              <p className="text-sm text-slate-800">{viewRow.title}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Department</label>
              <p className="text-sm text-slate-800">{viewRow.department}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Location</label>
              <p className="text-sm text-slate-800">{viewRow.location}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.status}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New job posting"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleCreate()}
            saving={createMutation.isPending}
            saveLabel="Create posting"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Title *</label>
            <input className="erp-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description * (min 20 chars)</label>
            <textarea
              className="erp-input min-h-28"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Department *</label>
            <input
              className="erp-input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Location *</label>
            <input
              className="erp-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Level</label>
            <select className="erp-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {["EntryLevel", "Junior", "MidLevel", "Senior", "Lead", "Manager"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Job type</label>
            <select
              className="erp-select"
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            >
              {["FullTime", "PartTime", "Contract", "Internship"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Min salary</label>
            <input
              type="number"
              className="erp-input"
              value={form.minSalary}
              onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Max salary</label>
            <input
              type="number"
              className="erp-input"
              value={form.maxSalary}
              onChange={(e) => setForm({ ...form, maxSalary: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Closing date *</label>
            <input
              type="date"
              className="erp-input"
              value={form.closingDate}
              onChange={(e) => setForm({ ...form, closingDate: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Positions</label>
            <input
              type="number"
              min={1}
              className="erp-input"
              value={form.numberOfPositions}
              onChange={(e) => setForm({ ...form, numberOfPositions: e.target.value })}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Required skills</label>
            <input
              className="erp-input"
              value={form.requiredSkills}
              onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
