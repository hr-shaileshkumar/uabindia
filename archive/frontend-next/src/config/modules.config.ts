import hrmsSidebar from "@/modules/hrms/sidebar";

type SubModuleLink = {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
};

const moduleMap: Record<string, SubModuleLink[]> = {
  hrms: hrmsSidebar,
  payroll: [],
  reports: [],
  erp: [],
  platform: [],
  licensing: [],
  security: [],
};

export function getSubModulesForModule(moduleKey: string): SubModuleLink[] {
  return moduleMap[moduleKey] || [];
}

export default moduleMap;
