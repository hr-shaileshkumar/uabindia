"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
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
  const filtered = postings.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
  });

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

  return (
    <StandardPageLayout
      title="Recruitment"
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
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter job title or department…" />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          <ErpCreateButton
            label="New posting"
            onClick={() => {
              setForm(emptyForm());
              setDrawerOpen(true);
            }}
          />
        </>
      }
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load job postings.")}</div>
      ) : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Job Title</th>
                <th className="erp-th">Department</th>
                <th className="erp-th">Location</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td">
                    <ErpEmptyState
                      message="No job postings found. Create a posting to start hiring."
                      action={
                        <ErpCreateButton
                          label="New posting"
                          onClick={() => {
                            setForm(emptyForm());
                            setDrawerOpen(true);
                          }}
                        />
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="erp-tr">
                    <td className="erp-td text-xs font-semibold text-slate-900">{p.title}</td>
                    <td className="erp-td text-xs">{p.department}</td>
                    <td className="erp-td text-xs text-slate-500">{p.location}</td>
                    <td className="erp-td">
                      <span className={p.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                        {p.status}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <ErpRowActions onView={{ label: "View", onClick: () => setViewRow(p) }} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

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
