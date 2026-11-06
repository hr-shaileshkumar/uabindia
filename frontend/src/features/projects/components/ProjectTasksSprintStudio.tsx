"use client";

import React, { useState, useMemo } from "react";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Save,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export type TaskStatus = "BACKLOG" | "TO_DO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export interface ProjectTask {
  id: string;
  taskKey: string;
  title: string;
  projectName: string;
  assignee: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  storyPoints: number;
  status: TaskStatus;
  dueDate: string;
  hoursLogged: number;
}

export interface TimesheetRow {
  id: string;
  projectName: string;
  taskDescription: string;
  isBillable: boolean;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

export const INITIAL_TASKS: ProjectTask[] = [
  {
    id: "tsk-1",
    taskKey: "PRJ-401",
    title: "Implement High-Frequency CAN-Bus Telemetry Ingestion Service",
    projectName: "Autonomous Fleet Tracking",
    assignee: "Ananya Roy",
    priority: "Urgent",
    storyPoints: 8,
    status: "IN_PROGRESS",
    dueDate: "2026-11-06",
    hoursLogged: 16,
  },
  {
    id: "tsk-2",
    taskKey: "PRJ-402",
    title: "Configure Modbus RTU PLC Communication Drivers for 15KW Servo",
    projectName: "Smart Factory Automation",
    assignee: "Ganesh Kulkarni",
    priority: "High",
    storyPoints: 5,
    status: "IN_REVIEW",
    dueDate: "2026-11-04",
    hoursLogged: 22,
  },
  {
    id: "tsk-3",
    taskKey: "PRJ-403",
    title: "GST E-Way Bill Auto-Generation on Dispatch Staging",
    projectName: "Enterprise ERP Substrate",
    assignee: "Vikram Seth",
    priority: "High",
    storyPoints: 5,
    status: "TO_DO",
    dueDate: "2026-11-10",
    hoursLogged: 4,
  },
  {
    id: "tsk-4",
    taskKey: "PRJ-404",
    title: "Design Spatial 3D Bin Matrix UI for Bhiwandi Central Depot",
    projectName: "Warehouse Logistics WMS",
    assignee: "Rohan Varma",
    priority: "Medium",
    storyPoints: 3,
    status: "DONE",
    dueDate: "2026-10-31",
    hoursLogged: 18,
  },
  {
    id: "tsk-5",
    taskKey: "PRJ-405",
    title: "Optimize ASP.NET Core EF Core Database Indexes on General Ledger",
    projectName: "Enterprise ERP Substrate",
    assignee: "Ananya Roy",
    priority: "Medium",
    storyPoints: 5,
    status: "BACKLOG",
    dueDate: "2026-11-18",
    hoursLogged: 0,
  },
];

export const INITIAL_TIMESHEETS: TimesheetRow[] = [
  {
    id: "ts-1",
    projectName: "Autonomous Fleet Tracking",
    taskDescription: "CAN-Bus telemetry parsing & SignalR gateway optimization",
    isBillable: true,
    mon: 8,
    tue: 8,
    wed: 7.5,
    thu: 8,
    fri: 8,
    sat: 0,
    sun: 0,
  },
  {
    id: "ts-2",
    projectName: "Smart Factory Automation",
    taskDescription: "Modbus RTU PLC hardware testing with industrial servo",
    isBillable: true,
    mon: 2,
    tue: 3,
    wed: 4,
    thu: 2,
    fri: 4,
    sat: 0,
    sun: 0,
  },
  {
    id: "ts-3",
    projectName: "Internal R&D / Architecture",
    taskDescription: "Sprint planning, architecture reviews, and team standup",
    isBillable: false,
    mon: 1,
    tue: 1,
    wed: 1,
    thu: 1,
    fri: 1,
    sat: 0,
    sun: 0,
  },
];

export const TASK_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-500/10 text-slate-600" },
  { id: "TO_DO", label: "To Do", color: "bg-blue-500/10 text-blue-600" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500/10 text-amber-600" },
  { id: "IN_REVIEW", label: "In Review / QA", color: "bg-purple-500/10 text-purple-600" },
  { id: "DONE", label: "Done & Shipped", color: "bg-emerald-500/10 text-emerald-600" },
];

export function ProjectTasksSprintStudio({ initialTab = "KANBAN" }: { initialTab?: "KANBAN" | "TIMESHEETS" }) {
  const [activeTab, setActiveTab] = useState<"KANBAN" | "TIMESHEETS">(initialTab);
  const [tasks, setTasks] = useState<ProjectTask[]>(INITIAL_TASKS);
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>(INITIAL_TIMESHEETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchAssignee = assigneeFilter === "ALL" || t.assignee === assigneeFilter;
      const matchSearch =
        t.taskKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAssignee && matchSearch;
    });
  }, [tasks, assigneeFilter, searchQuery]);

  // Timesheet calculations
  const totalWeeklyHours = useMemo(() => {
    return timesheets.reduce((sum, r) => sum + r.mon + r.tue + r.wed + r.thu + r.fri + r.sat + r.sun, 0);
  }, [timesheets]);

  const billableHours = useMemo(() => {
    return timesheets
      .filter((r) => r.isBillable)
      .reduce((sum, r) => sum + r.mon + r.tue + r.wed + r.thu + r.fri + r.sat + r.sun, 0);
  }, [timesheets]);

  // Stage Advancement Handler
  const handleAdvanceTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const colIdx = TASK_COLUMNS.findIndex((c) => c.id === t.status);
        if (colIdx < TASK_COLUMNS.length - 1) {
          const nextStatus = TASK_COLUMNS[colIdx + 1].id;
          notifySuccess(`Task ${t.taskKey} moved to ${TASK_COLUMNS[colIdx + 1].label}`);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Projects Sprint Execution & Timesheet Studio
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                Agile Jira / Linear Grade
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sprint Kanban task board, effort estimation, story point burn-down, and weekly employee billing timesheet matrix
            </p>
          </div>
        </div>

        {/* Tab Switcher & Create Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab("KANBAN")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "KANBAN"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sprint Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("TIMESHEETS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "TIMESHEETS"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Weekly Timesheets
            </button>
          </div>

          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Issue / Task
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Sprint Open Tasks</span>
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {tasks.filter((t) => t.status !== "DONE").length} Tasks
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {tasks.reduce((sum, t) => sum + t.storyPoints, 0)} Total Story Points
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Completed (Sprint 12)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {tasks.filter((t) => t.status === "DONE").length} Shipped
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            On track for milestone delivery
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Weekly Hours Logged</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">
            {totalWeeklyHours} hrs
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {billableHours} hrs billable ({Math.round((billableHours / (totalWeeklyHours || 1)) * 100)}% utilization)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Sprint Velocity</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            26 pts
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            +4.2 pts vs team rolling average
          </div>
        </div>
      </div>

      {activeTab === "KANBAN" ? (
        /* Sprint Kanban Tab */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search issue key, task or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <label className="text-xs font-semibold text-muted-foreground">Assignee:</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Team Members</option>
                <option value="Ananya Roy">Ananya Roy</option>
                <option value="Ganesh Kulkarni">Ganesh Kulkarni</option>
                <option value="Vikram Seth">Vikram Seth</option>
                <option value="Rohan Varma">Rohan Varma</option>
              </select>
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
            {TASK_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              const colPoints = colTasks.reduce((sum, t) => sum + t.storyPoints, 0);

              return (
                <div
                  key={col.id}
                  className="bg-card/70 border border-border/70 rounded-2xl p-3.5 flex flex-col min-w-[240px] shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-border/70 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        ({colPoints} pts)
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-border/80 bg-background hover:border-primary/50 hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono text-[11px] font-bold text-primary">
                            {t.taskKey}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              t.priority === "Urgent"
                                ? "bg-rose-500/10 text-rose-600"
                                : t.priority === "High"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-foreground leading-snug">
                          {t.title}
                        </div>

                        <div className="text-[11px] text-muted-foreground truncate">
                          📁 {t.projectName}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {t.assignee}
                          </span>
                          <span className="font-bold px-1.5 py-0.5 rounded-md bg-muted text-foreground">
                            {t.storyPoints} pts
                          </span>
                        </div>

                        {col.id !== "DONE" && (
                          <button
                            onClick={() => handleAdvanceTask(t.id)}
                            className="w-full text-center py-1 rounded-md bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                          >
                            Advance Stage →
                          </button>
                        )}
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="p-4 text-center text-[11px] text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                        No tasks in this lane
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Timesheets Matrix Tab */
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Weekly Billing & Effort Timesheet Matrix</h2>
              <p className="text-xs text-muted-foreground">
                Current Period: Week 44 (27 Oct 2026 - 02 Nov 2026) • Approved by Project Manager
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => notifySuccess("Timesheet submitted for managerial approval.")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Submit Weekly Timesheet
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border/80 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3 min-w-[180px]">Project</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Task Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">Type</th>
                  <th className="py-2.5 px-2 text-center w-12">Mon</th>
                  <th className="py-2.5 px-2 text-center w-12">Tue</th>
                  <th className="py-2.5 px-2 text-center w-12">Wed</th>
                  <th className="py-2.5 px-2 text-center w-12">Thu</th>
                  <th className="py-2.5 px-2 text-center w-12">Fri</th>
                  <th className="py-2.5 px-2 text-center w-12">Sat</th>
                  <th className="py-2.5 px-2 text-center w-12">Sun</th>
                  <th className="py-2.5 px-3 text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {timesheets.map((row) => {
                  const rowSum = row.mon + row.tue + row.wed + row.thu + row.fri + row.sat + row.sun;
                  return (
                    <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">{row.projectName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{row.taskDescription}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            row.isBillable
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {row.isBillable ? "Billable" : "Internal"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.mon || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.tue || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.wed || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.thu || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.fri || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.sat || "—"}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{row.sun || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">{rowSum}h</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/70 font-bold border-t border-border">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                    Total Hours Logged:
                  </td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.mon, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.tue, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.wed, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.thu, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.fri, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.sat, 0)}h</td>
                  <td className="py-3 px-2 text-center font-mono">{timesheets.reduce((s, r) => s + r.sun, 0)}h</td>
                  <td className="py-3 px-3 text-right font-black text-primary text-xs">{totalWeeklyHours}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {createTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Create Sprint Task
              </h3>
              <button
                onClick={() => setCreateTaskModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Task Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Implement Webhook Dispatcher for Invoices"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Target Project:</label>
                <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                  <option value="Autonomous Fleet Tracking">Autonomous Fleet Tracking</option>
                  <option value="Smart Factory Automation">Smart Factory Automation</option>
                  <option value="Enterprise ERP Substrate">Enterprise ERP Substrate</option>
                  <option value="Warehouse Logistics WMS">Warehouse Logistics WMS</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Story Points:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-semibold">
                    <option value="1">1 pt (Trivial)</option>
                    <option value="2">2 pts (Small)</option>
                    <option value="3">3 pts (Medium)</option>
                    <option value="5">5 pts (Standard)</option>
                    <option value="8">8 pts (Complex)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Priority:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Assignee:</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium">
                    <option value="Ananya Roy">Ananya Roy</option>
                    <option value="Ganesh Kulkarni">Ganesh Kulkarni</option>
                    <option value="Vikram Seth">Vikram Seth</option>
                    <option value="Rohan Varma">Rohan Varma</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
              <button
                onClick={() => setCreateTaskModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  notifySuccess("Task created and scheduled into sprint backlog.");
                  setCreateTaskModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

