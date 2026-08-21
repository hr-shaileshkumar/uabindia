"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpSearchFilter } from "@/components/erp/erp-page-kit";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { hrmsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";

interface TrainingRow {
  id: string;
  courseTitle: string;
  category: string;
  instructor: string;
  enrolledCount: number;
  durationHours: number;
  status: "Active Program" | "Upcoming" | "Completed";
}

type TrainingCourseResponse = {
  id: string;
  title?: string;
  name?: string;
  category?: string;
  instructor?: string;
  currentEnrollment?: number;
  durationHours?: number;
  duration?: number;
  status?: string;
};

type CourseForm = {
  title: string;
  description: string;
  category: string;
  instructor: string;
  level: string;
  deliveryMode: string;
  durationHours: string;
  startDate: string;
  maxParticipants: string;
};

const emptyForm = (): CourseForm => ({
  title: "",
  description: "",
  category: "General",
  instructor: "",
  level: "Intermediate",
  deliveryMode: "Online",
  durationHours: "8",
  startDate: new Date().toISOString().slice(0, 10),
  maxParticipants: "20",
});

function mapCourseStatus(status?: string): TrainingRow["status"] {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "archived":
      return "Completed";
    case "scheduled":
    case "draft":
      return "Upcoming";
    default:
      return "Active Program";
  }
}

export default function TrainingLearningPage() {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.training.getCourses(0, 100);
      const courses = (Array.isArray(res.data) ? res.data : []) as TrainingCourseResponse[];
      setTrainings(
        courses.map((course) => ({
          id: course.id,
          courseTitle: course.title || course.name || "Untitled course",
          category: course.category || "General",
          instructor: course.instructor || "Unassigned",
          enrolledCount: course.currentEnrollment ?? 0,
          durationHours: course.durationHours ?? course.duration ?? 0,
          status: mapCourseStatus(course.status),
        }))
      );
    } catch (err) {
      setTrainings([]);
      setError(getApiErrorMessage(err, "Failed to load training courses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const filteredTrainings = trainings.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.courseTitle.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.instructor.toLowerCase().includes(q);
  });

  const stats = [
    { label: "Active programs", value: trainings.filter((t) => t.status === "Active Program").length, tone: "positive" as const },
    { label: "Enrolled staff", value: trainings.reduce((acc, t) => acc + t.enrolledCount, 0), tone: "info" as const },
    { label: "Courses", value: trainings.length, tone: "warning" as const },
    { label: "Avg duration", value: trainings.length ? `${Math.round(trainings.reduce((sum, t) => sum + t.durationHours, 0) / trainings.length)}h` : "0h", tone: "neutral" as const },
  ];

  const handleCreate = async () => {
    if (form.title.trim().length < 5) {
      setError("Course title must be at least 5 characters.");
      return;
    }
    const description = form.description.trim().length >= 20
      ? form.description.trim()
      : `${form.title.trim()} — classroom or online program for enrolled staff.`;
    try {
      setSaving(true);
      setError(null);
      await hrmsApi.training.createCourse({
        title: form.title.trim(),
        description,
        category: form.category.trim() || "General",
        instructor: form.instructor.trim() || undefined,
        level: form.level,
        deliveryMode: form.deliveryMode,
        durationHours: Number(form.durationHours) || 8,
        startDate: form.startDate,
        maxParticipants: Number(form.maxParticipants) || 20,
      });
      notifySuccess("Training program created.");
      setDrawerOpen(false);
      setForm(emptyForm());
      await fetchCourses();
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not create the training program.");
      setError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Training & Certifications"
      icon="award"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void fetchCourses()} loading={loading} />
          <ErpCreateButton
            label="Add program"
            onClick={() => {
              setForm(emptyForm());
              setDrawerOpen(true);
            }}
          />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter course, category, or instructor..." />}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}
      <CrudCard>
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Course Title</th>
                <th className="erp-th">Category</th>
                <th className="erp-th">Lead Instructor</th>
                <th className="erp-th">Enrolled Staff</th>
                <th className="erp-th">Duration</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainings.map((t) => (
                <tr key={t.id} className="erp-tr">
                  <td className="erp-td font-semibold text-xs text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-slate-500" />
                      {t.courseTitle}
                    </span>
                  </td>
                  <td className="erp-td">
                    <span className="erp-chip erp-chip-neutral">{t.category}</span>
                  </td>
                  <td className="erp-td text-xs text-slate-700">{t.instructor}</td>
                  <td className="erp-td font-mono text-xs font-bold">{t.enrolledCount} Staff</td>
                  <td className="erp-td font-mono text-xs">{t.durationHours}h</td>
                  <td className="erp-td">
                    <span className={`erp-chip ${t.status === "Completed" ? "erp-chip-neutral" : t.status === "Upcoming" ? "erp-chip-warning" : "erp-chip-success"}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filteredTrainings.length === 0 ? (
                <tr>
                  <td className="erp-td py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No training courses found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New training program"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleCreate()}
            saving={saving}
            saveLabel="Save program"
            disabled={!form.title.trim()}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="erp-label">Title</label>
            <input className="erp-input mt-1" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="erp-label">Description</label>
            <textarea
              className="erp-input mt-1 min-h-20 py-2"
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              placeholder="What this program covers"
            />
          </div>
          <div>
            <label className="erp-label">Category</label>
            <input className="erp-input mt-1" value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} />
          </div>
          <div>
            <label className="erp-label">Instructor</label>
            <input className="erp-input mt-1" value={form.instructor} onChange={(e) => setForm((current) => ({ ...current, instructor: e.target.value }))} />
          </div>
          <div>
            <label className="erp-label">Level</label>
            <select className="erp-select mt-1" value={form.level} onChange={(e) => setForm((current) => ({ ...current, level: e.target.value }))}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Delivery</label>
            <select className="erp-select mt-1" value={form.deliveryMode} onChange={(e) => setForm((current) => ({ ...current, deliveryMode: e.target.value }))}>
              <option value="Online">Online</option>
              <option value="Classroom">Classroom</option>
              <option value="Hybrid">Hybrid</option>
              <option value="SelfPaced">Self paced</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Duration (hours)</label>
            <input type="number" min={1} className="erp-input mt-1" value={form.durationHours} onChange={(e) => setForm((current) => ({ ...current, durationHours: e.target.value }))} />
          </div>
          <div>
            <label className="erp-label">Start date</label>
            <input type="date" className="erp-input mt-1" value={form.startDate} onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="erp-label">Max participants</label>
            <input type="number" min={1} className="erp-input mt-1" value={form.maxParticipants} onChange={(e) => setForm((current) => ({ ...current, maxParticipants: e.target.value }))} />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
