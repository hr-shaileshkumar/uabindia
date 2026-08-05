import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import {
  setupDomainMap,
  setupDomains,
  setupGates,
  setupHierarchy,
  setupStages,
} from "@/lib/erp/setup-blueprint";
import { ShieldCheck, GitMerge, Sliders, CheckCircle2, ArrowRight } from "lucide-react";

export default function CoreSettingsPage() {
  return (
    <StandardPageLayout
      title="Master & Configuration Workspace"
      subtitle="Run platform, tenant, company, structure, security, workflow, compliance, and go-live setup from one end-to-end operating model."
      eyebrow="Platform / Setup Architecture"
      icon="settings"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Hierarchy Levels", value: setupHierarchy.length, tone: "info" },
            { label: "Setup Domains", value: setupDomains.length, tone: "success" },
            { label: "Process Stages", value: setupStages.length, tone: "warning" },
            { label: "Go-Live Gates", value: setupGates.length, tone: "danger" },
          ]}
        />
      }
    >
      <div className="space-y-6">
        {/* Architecture Principle Banner */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
            Architecture Principle
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            Setup is not CRUD. It is dependency orchestration.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-5xl">
            Every setup surface behaves like a configuration center with inheritance, validation,
            workflow ownership, auditability, and go-live gates. This workspace is the single
            entry point for platform initialization, tenant rollout, company configuration, project
            readiness, and production activation.
          </p>
        </section>

        {/* Inheritance Model Grid */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <GitMerge className="h-4 w-4" />
                Inheritance Model
              </div>
              <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                One hierarchy drives permissions, workflow, payroll, attendance, and reporting
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Lower layers inherit policy, scope, and operational defaults from above.
            </p>
          </div>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {setupHierarchy.map((level, index) => (
              <div
                key={level.key}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{level.label}</p>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{level.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Setup Domains */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sliders className="h-4 w-4" />
            Setup Domains
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
            Linked workspaces for master data, governance, and activation controls
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setupDomains.map((domain) => (
              <Link
                key={domain.key}
                href={domain.route}
                className="group rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {domain.label}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      domain.status === "ready"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                        : domain.status === "partial"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {domain.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{domain.summary}</p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Owner: {domain.owner}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* End-To-End Process */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="h-4 w-4" />
            End-To-End Setup Flow
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
            Process-wise setup flow from initialization to continuous monitoring
          </h2>

          <div className="mt-4 space-y-3.5">
            {setupStages.map((stage) => (
              <div key={stage.step} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        {stage.step}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{stage.title}</h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{stage.summary}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-500">
                    Gate: <span className="font-semibold text-slate-900 dark:text-slate-100">{stage.gate}</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outputs</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stage.outputs.map((item) => (
                        <span key={item} className="inline-flex rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dependencies</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stage.dependencies.length > 0 ? stage.dependencies.map((item) => (
                        <span key={item} className="inline-flex rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 border border-amber-200/80">
                          {item}
                        </span>
                      )) : (
                        <span className="inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200/80">
                          Initial stage
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked Workspaces</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stage.linkedDomains.map((domainKey) => {
                        const domain = setupDomainMap.get(domainKey);
                        if (!domain) return null;
                        return (
                          <Link key={domainKey} href={domain.route} className="inline-flex rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 hover:underline">
                            {domain.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Go-Live Gates */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
            Go-Live Gates
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
            Mandatory validation points before production activation
          </h2>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {setupGates.map((gate, index) => (
              <div key={gate} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Gate {index + 1}
                </p>
                <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-800 dark:text-slate-200">{gate}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}
