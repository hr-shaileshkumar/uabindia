export type RolePermission = {
  role: string;
  modules: string[];
  pages: string[];
};

export const rolePermissions: RolePermission[] = [
  {
    role: "Super Admin",
    modules: ["hrms", "payroll", "reports", "erp", "platform", "licensing", "security", "users", "companies"],
    pages: ["*"] // All pages
  },
  {
    role: "Administrator",
    modules: ["hrms", "payroll", "reports", "users", "companies"],
    pages: ["*"]
  },
  {
    role: "Admin",
    modules: ["hrms", "payroll", "reports", "users", "companies"],
    pages: ["*"]
  },
  {
    role: "Reporting Manager",
    modules: ["hrms", "payroll", "reports"],
    pages: ["/erp/hrms/*", "/erp/payroll/*", "/erp/reports/*"]
  },
  {
    role: "Employee",
    modules: ["hrms"],
    pages: ["/erp/hrms/attendance", "/erp/hrms/leave", "/erp/hrms/payslips"]
  }
];

export function getRolePermissions(role: string): RolePermission | undefined {
  return rolePermissions.find(rp => rp.role.toLowerCase() === role.toLowerCase());
}

export function hasModuleAccess(role: string, moduleKey: string): boolean {
  const permission = getRolePermissions(role);
  if (!permission) return false;
  return permission.modules.includes(moduleKey) || permission.modules.includes("*");
}

export function hasPageAccess(role: string, pagePath: string): boolean {
  const permission = getRolePermissions(role);
  if (!permission) return false;
  if (permission.pages.includes("*")) return true;
  return permission.pages.some(page => {
    if (page.endsWith("/*")) {
      const prefix = page.slice(0, -2);
      return pagePath.startsWith(prefix);
    }
    return page === pagePath;
  });
}