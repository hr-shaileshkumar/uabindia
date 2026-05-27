"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Company, Project, FinancialYear } from "@/types";
import GlobalSearch from "./GlobalSearch";
import { hrApi } from "@/lib/hrApi";
import apiClient from "@/lib/apiClient";
import { Module } from "@/types";
import { useOrgContext } from "@/context/OrgContext";

export interface TopbarProps {
  user: User;
  modules: Module[];
  appVersion?: string;
  onRefresh?: () => void;
  onLogout?: () => void;
}

export function Topbar({
  user,
  modules,
  appVersion = "1.0.0",
  onRefresh,
  onLogout,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    companyId: ctxCompanyId,
    companyName: ctxCompanyName,
    projectId: ctxProjectId,
    projectName: ctxProjectName,
    setContext,
  } = useOrgContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showFinancialYearDropdown, setShowFinancialYearDropdown] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>(
    ctxCompanyId || user.companyId || ""
  );
  const [selectedProject, setSelectedProject] = useState<string>(
    ctxProjectId || ""
  );
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingFinancialYears, setIsLoadingFinancialYears] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [financialYearsError, setFinancialYearsError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const manualProjectLoadRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedCompany(ctxCompanyId || user.companyId || "");
  }, [ctxCompanyId, user?.companyId]);

  useEffect(() => {
    setSelectedProject(ctxProjectId || "");
  }, [ctxProjectId]);

  // Get current module context from pathname
  const getCurrentModule = () => {
    const pathParts = pathname.split("/");
    if (pathParts[2] === "modules" && pathParts[3]) {
      const moduleKey = pathParts[3];
      const currentModule = modules.find(m => m.key === moduleKey);
      return currentModule?.name || moduleKey.toUpperCase();
    }
    if (pathParts[2]) {
      if (pathParts[2].toLowerCase() === "erp") return "ERP";
      if (pathParts[2].toLowerCase() === "hrms") return "HRMS";
      return pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
    }
    return "Dashboard";
  };

  // Get company logo
  const getCompanyLogo = () => {
    const currentCompany = companies.find((c) => c.id === selectedCompany);
    return currentCompany?.logoUrl || null;
  };

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoadingCompanies(true);
      setCompaniesError(null);
      const res = await hrApi.company.getAll();
      const nextCompanies = res.data.companies || [];
      setCompanies(nextCompanies);

      if (!ctxCompanyId && !selectedCompany && nextCompanies.length > 0) {
        setSelectedCompany(nextCompanies[0].id);
      }
    } catch (error) {
      setCompaniesError("Unable to load companies");
      console.error("Failed to fetch companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [ctxCompanyId, selectedCompany]);

  const loadProjects = useCallback(
    async (
      companyId: string,
      opts?: { companyName?: string; preferredProjectId?: string; syncContext?: boolean }
    ) => {
      if (!companyId) {
        setProjects([]);
        setSelectedProject("");
        return;
      }

      try {
        setIsLoadingProjects(true);
        setProjectsError(null);
        const res = await hrApi.project.getByCompany(companyId);
        const projectsList = res.data.projects || [];
        setProjects(projectsList);

        let nextProjectId = opts?.preferredProjectId ?? selectedProject;
        if (nextProjectId && !projectsList.some((p) => p.id === nextProjectId)) {
          nextProjectId = "";
        }
        if (!nextProjectId && projectsList.length > 0) {
          nextProjectId = projectsList[0].id;
        }

        setSelectedProject(nextProjectId);

        const shouldSync =
          (opts?.syncContext ?? true) &&
          Boolean(nextProjectId) &&
          (ctxCompanyId !== companyId || ctxProjectId !== nextProjectId);

        if (shouldSync && nextProjectId) {
          const resolvedCompany = companies.find((c) => c.id === companyId);
          const resolvedProject = projectsList.find((p) => p.id === nextProjectId);

          const resolvedCompanyName = resolvedCompany?.name ?? opts?.companyName ?? ctxCompanyName ?? companyId;
          const resolvedProjectName = resolvedProject?.name ?? ctxProjectName ?? nextProjectId;

          setContext({
            companyId,
            companyName: resolvedCompanyName,
            projectId: nextProjectId,
            projectName: resolvedProjectName,
          });
        }
      } catch (error) {
        setProjects([]);
        setProjectsError("Unable to load projects");
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    },
    [
      selectedProject,
      companies,
      ctxCompanyId,
      ctxProjectId,
      ctxCompanyName,
      ctxProjectName,
      setContext,
    ]
  );

  const loadFinancialYears = useCallback(async () => {
    try {
      setIsLoadingFinancialYears(true);
      setFinancialYearsError(null);
      const res = await hrApi.system.financialYears();
      const years: FinancialYear[] = res.data || [];
      setFinancialYears(years);
      const current = years.find((y: FinancialYear) => y.isCurrent);
      if (current) {
        setSelectedFinancialYear(current.key);
      } else if (years.length > 0) {
        setSelectedFinancialYear(years[0].key);
      }
    } catch (error) {
      setFinancialYearsError("Unable to load financial years");
      console.error("Failed to fetch financial years:", error);
    } finally {
      setIsLoadingFinancialYears(false);
    }
  }, []);

  // Fetch companies on mount
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]); // Only fetch on mount, not on user.companyId changes to prevent infinite loop

  // Fetch projects when company changes
  useEffect(() => {
    if (!selectedCompany) return;
    if (manualProjectLoadRef.current === selectedCompany) {
      manualProjectLoadRef.current = null;
      return;
    }
    loadProjects(selectedCompany);
  }, [selectedCompany, loadProjects]);

  // Fetch financial years on mount
  useEffect(() => {
    loadFinancialYears();
  }, [loadFinancialYears]);

  // Handle click outside profile/admin menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(e.target as Node)
      ) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        apiClient.get("/auth/me"),
        hrApi.modules.getEnabled(),
        loadCompanies(),
        loadFinancialYears(),
      ]);
      if (selectedCompany) {
        await loadProjects(selectedCompany);
      }
      onRefresh?.();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      onLogout?.();
      router.replace("/login");
    }
  };

  const updateContextForProject = useCallback(
    (projectId: string) => {
      if (!projectId || !selectedCompany) return;
      if (ctxCompanyId === selectedCompany && ctxProjectId === projectId) return;
      const company = companies.find((c) => c.id === selectedCompany);
      const project = projects.find((p) => p.id === projectId);
      if (!company || !project) return;

      setContext({
        companyId: company.id,
        companyName: company.name,
        projectId: project.id,
        projectName: project.name,
      });
    },
    [companies, projects, selectedCompany, ctxCompanyId, ctxProjectId, setContext]
  );

  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const isAdmin = roles.includes("Admin") || roles.includes("SystemAdmin") || roles.includes("SuperAdmin");
  const primaryRole = user.role || roles[0] || "User";

  const displayName =
    user.fullName?.trim() && user.fullName.trim() !== "Admin User"
      ? user.fullName.trim()
      : primaryRole;

  const initials = (displayName || "User")
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part?.[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  const selectedCompanyName =
    (ctxCompanyName ??
      companies.find((c) => c.id === selectedCompany)?.name) ||
    (isLoadingCompanies ? "Loading..." : "Select Company");
  const selectedProjectName = isLoadingProjects
    ? "Loading..."
    : ctxProjectName ??
      (selectedProject
        ? projects.find((p) => p.id === selectedProject)?.name || "Select Project"
        : null) ??
      (selectedProject ? "Select Project" : "All Projects");

  const selectedFinancialYearLabel =
    financialYears.find((y) => y.key === selectedFinancialYear)?.label || "Financial Year";

  const companyLogo = getCompanyLogo();

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/80 shadow-(--erp-shadow) backdrop-blur-xl">
      <div className="h-20 px-6 flex items-center justify-between gap-4">
        {/* Left: Company/Client Logo + Branding */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo */}
          <div className="relative h-12 w-12 shrink-0">
            {companyLogo && !logoError ? (
              <Image
                src={companyLogo}
                alt="Company Logo"
                fill
                sizes="80px"
                className="object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Image
                src="/logo.png"
                alt="UABIndia ERP Logo"
                fill
                sizes="80px"
                className="object-contain"
                loading="eager"
              />
            )}
          </div>

          {/* Module Context */}
          <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-white/40">
            <span className="text-xs font-semibold text-slate-500">Workspace</span>
            <span className="text-sm font-semibold text-slate-800">
              {getCurrentModule()}
            </span>
          </div>
        </div>

        {/* Center: Global Command Search */}
        <div className="flex-1 max-w-md px-4">
          <GlobalSearch modules={modules} />
        </div>

        {/* Right: Utility Cluster */}
        <div className="flex items-center gap-2">
          {/* Company Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCompanyDropdown(!showCompanyDropdown);
                setShowProjectDropdown(false);
              }}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white/70 hover:bg-white border border-white/60 rounded-xl transition flex items-center gap-2 shadow-sm"
              disabled={isLoadingCompanies}
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
              </svg>
              <span className="max-w-32 truncate">{isLoadingCompanies ? "Loading..." : selectedCompanyName}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showCompanyDropdown && !isLoadingCompanies && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-white/60 rounded-xl shadow-xl z-50 py-1 max-h-72 overflow-auto">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">Select Company</p>
                </div>
                {companiesError && (
                  <div className="px-3 py-2 text-xs text-red-600">{companiesError}</div>
                )}
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setShowCompanyDropdown(false);
                      setSelectedCompany(company.id);
                      setSelectedProject("");
                      manualProjectLoadRef.current = company.id;
                      loadProjects(company.id, {
                        companyName: company.name,
                        preferredProjectId: "",
                        syncContext: true,
                      });
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition ${
                      selectedCompany === company.id
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {company.name}
                  </button>
                ))}
                {!companiesError && companies.length === 0 && (
                  <div className="px-3 py-3 text-xs text-gray-500">No companies found.</div>
                )}
                <div className="border-t border-gray-200">
                  <Link
                    href="/platform/companies"
                    className="block px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Manage companies →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Project Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProjectDropdown(!showProjectDropdown);
                setShowCompanyDropdown(false);
                setShowFinancialYearDropdown(false);
              }}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white/70 hover:bg-white border border-white/60 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              disabled={isLoadingProjects}
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
              <span className="max-w-32 truncate">
                {isLoadingProjects ? "Loading..." : selectedProjectName}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showProjectDropdown && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-white/60 rounded-xl shadow-xl z-50 py-1 max-h-72 overflow-auto">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">Select Project</p>
                </div>
                {projectsError && (
                  <div className="px-3 py-2 text-xs text-red-600">{projectsError}</div>
                )}
                <button
                  onClick={() => {
                    setSelectedProject("");
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition ${
                    selectedProject === ""
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Projects
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project.id);
                      setShowProjectDropdown(false);
                      updateContextForProject(project.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition ${
                      selectedProject === project.id
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
                {!projectsError && projects.length === 0 && !isLoadingProjects && (
                  <div className="px-3 py-3 text-xs text-gray-500">No projects found.</div>
                )}
                <div className="border-t border-gray-200">
                  <Link
                    href="/platform/projects"
                    className="block px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Manage projects →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Financial Year Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFinancialYearDropdown(!showFinancialYearDropdown);
                setShowCompanyDropdown(false);
                setShowProjectDropdown(false);
              }}
              className="h-10 px-4 text-sm font-semibold text-slate-700 bg-white/70 hover:bg-white border border-white/60 rounded-xl transition flex items-center gap-2"
              disabled={isLoadingFinancialYears}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="max-w-32 truncate">{isLoadingFinancialYears ? "Loading..." : selectedFinancialYearLabel}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showFinancialYearDropdown && financialYears.length > 0 && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-white/60 rounded-xl shadow-xl z-50 py-1 max-h-72 overflow-auto">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">Select Financial Year</p>
                </div>
                {financialYearsError && (
                  <div className="px-3 py-2 text-xs text-red-600">{financialYearsError}</div>
                )}
                {financialYears.map((fy: FinancialYear) => (
                  <button
                    key={fy.key}
                    onClick={() => {
                      setSelectedFinancialYear(fy.key);
                      setShowFinancialYearDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition ${
                      selectedFinancialYear === fy.key
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {fy.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-white/60"></div>

          {/* Version Badge */}
          <div className="hidden sm:flex items-center px-3 py-2 text-xs font-semibold text-slate-600 bg-white/70 rounded-xl border border-white/60">
            <span>v{appVersion}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl transition disabled:opacity-50 border border-white/60"
            title="Refresh context"
          >
            <svg
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Notifications */}
          <button className="h-10 w-10 flex items-center justify-center text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition relative border border-white/60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-white/60"></div>

          {isAdmin && (
            <div ref={adminMenuRef} className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="h-10 px-3 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white rounded-xl border border-white/60 transition"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">⚙️</span>
                Admin
              </button>
              {showAdminMenu && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500">Admin Console</p>
                    <p className="text-sm font-semibold text-slate-900">Manage core data</p>
                  </div>
                  <div className="py-1">
                    <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/platform/companies">Companies</Link>
                    <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/platform/projects">Projects</Link>
                    <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/platform/users">Users</Link>
                    <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/platform/roles">Roles & Policies</Link>
                    <Link className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" href="/platform/tenants">Tenants</Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Avatar */}
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="h-10 px-2.5 flex items-center gap-2 hover:bg-white rounded-xl transition border border-white/60"
            >
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center">
                {initials}
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-white/60 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">Role: </span>
                  <span className="text-xs font-semibold text-gray-800">{primaryRole}</span>
                </div>
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    Preferences
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 border-t border-gray-200 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
