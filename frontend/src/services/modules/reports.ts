import apiClient from "@/services/apiClient";
import type { DashboardPayload } from "./types";
import type { ERPRole } from "@/lib/erp/types";
import { dashboardStatsByRole, dashboardTrendByRole } from "@/lib/erp/mock-data";
import { hrmsApi } from "./hrms";
import { platformApi } from "./platform";

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const fallbackForRole = (role: ERPRole): DashboardPayload => ({
  stats: dashboardStatsByRole[role],
  trend: dashboardTrendByRole[role],
  widgets: [],
  source: "fallback",
});

export const reportsApi = {
  getSummary: () => apiClient.get("/reports/dashboard"),

  async getRoleDashboard(role: ERPRole): Promise<DashboardPayload> {
    try {
      if (role === "super_admin") {
        const response = await platformApi.getProvisioningDashboard();
        const tenants = (response.data?.tenants as Array<{ name?: string; isActive?: boolean }> | undefined) ?? [];
        const activeCount = tenants.filter((tenant) => tenant.isActive !== false).length;
        return {
          stats: [
            { label: "Customer Companies", value: String(tenants.length), change: `${activeCount} active`, tone: "positive" },
            { label: "Provisioning Queue", value: String(Math.max(0, tenants.length - activeCount)), change: "Needs review", tone: "warning" },
            { label: "Platform Health", value: "Live", change: "Connected to database", tone: "positive" },
            { label: "Global Audit", value: "Enabled", change: "Owner console ready", tone: "default" },
          ],
          trend: dashboardTrendByRole.super_admin,
          widgets: [
            { title: "Tenant provisioning", description: "Live tenant records loaded from the platform database." },
            { title: "Owner governance", description: "Subscriptions, modules, support, and audit remain centralized here." },
          ],
          source: "api",
        };
      }

      if (role === "employee") {
        const summary = await reportsApi.getSummary();
        const hr = summary.data?.hr as { pendingLeaves?: number } | undefined;
        return {
          stats: [
            { label: "Leave Pending", value: String(hr?.pendingLeaves ?? 0), change: "From live HR data", tone: "warning" },
            { label: "Payslips", value: "Open", change: "Self-service ready", tone: "positive" },
            { label: "Attendance", value: "Today", change: "ESS workspace", tone: "default" },
            { label: "Support", value: "Open", change: "Helpdesk available", tone: "default" },
          ],
          trend: dashboardTrendByRole.employee,
          widgets: [
            { title: "Employee workspace", description: "Attendance, leave, payslips, and documents stay in a simplified ESS shell." },
          ],
          source: "api",
        };
      }

      const [summaryResponse, hrResponse] = await Promise.all([
        reportsApi.getSummary(),
        hrmsApi.getHrDashboard().catch(() => null),
      ]);

      const summary = summaryResponse.data ?? {};
      const hrDash = hrResponse?.data ?? {};
      const hr = summary.hr as { totalEmployees?: number; activeEmployees?: number; pendingLeaves?: number; todayAttendance?: number } | undefined;
      const payroll = summary.payroll as { thisMonthRuns?: number; totalPayout?: number } | undefined;

      return {
        stats: [
          { label: "Employees", value: String(hrDash.activeEmployees ?? hr?.activeEmployees ?? hr?.totalEmployees ?? 0), change: "Live headcount", tone: "positive" },
          { label: "Present Today", value: String(hrDash.presentToday ?? hr?.todayAttendance ?? 0), change: "Attendance feed", tone: "positive" },
          { label: "Pending Leaves", value: String(hrDash.pendingLeaves ?? hr?.pendingLeaves ?? 0), change: "Approval queue", tone: "warning" },
          { label: "Payroll Runs", value: String(payroll?.thisMonthRuns ?? 0), change: `Payout ${formatInr(Number(payroll?.totalPayout ?? 0))}`, tone: "default" },
        ],
        trend: dashboardTrendByRole[role] ?? dashboardTrendByRole.company_admin,
        widgets: [
          { title: "Connected dashboard", description: "KPI cards are now loaded from reports and HR APIs instead of static mock values." },
          { title: "Operations pulse", description: "Use approvals, payroll, and finance modules from the company workspace shell." },
        ],
        source: "api",
      };
    } catch {
      return fallbackForRole(role);
    }
  },
};
