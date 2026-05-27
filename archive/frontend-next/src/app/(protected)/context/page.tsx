"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hrApi } from "@/lib/hrApi";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import type { Company, Project } from "@/types";

export default function ContextSelectionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasContext, setContext } = useOrgContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    const roles = (user as AuthUser | null)?.roles || [];
    return roles.some((role) =>
      ["admin", "superadmin", "systemadmin"].includes(role.toLowerCase())
    );
  }, [user]);

  useEffect(() => {
    if (hasContext) {
      router.replace("/erp");
    }
  }, [hasContext, router]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const res = await hrApi.company.getAll(1, 200);
        const items = res.data?.companies || [];
        setCompanies(items);
        if (items.length === 1) {
          setSelectedCompanyId(items[0].id);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setProjects([]);
      setSelectedProjectId("");
      return;
    }

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const res = await hrApi.project.getByCompany(selectedCompanyId);
        const items = res.data?.projects || [];
        setProjects(items);
        if (items.length === 1) {
          setSelectedProjectId(items[0].id);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [selectedCompanyId]);

  const handleContinue = () => {
    const company = companies.find((c) => c.id === selectedCompanyId);
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!company || !project) return;
    setContext({
      companyId: company.id,
      companyName: company.name,
      projectId: project.id,
      projectName: project.name,
    });
    router.push("/erp");
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Context Required</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Select Company & Project</h1>
          <p className="mt-2 text-sm text-slate-600">
            ERP access is scoped by tenant, company, and project. Choose where you want to work.
          </p>
          {isAdmin && (
            <p className="mt-3 text-xs text-amber-700">
              Admin role detected. You can proceed without context if needed.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Project / Cost Center</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={!selectedCompanyId || projectsLoading}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleContinue}
              disabled={!selectedCompanyId || !selectedProjectId}
              className="rounded-full bg-teal-700 px-6 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Continue to ERP
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push("/erp")}
                className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
