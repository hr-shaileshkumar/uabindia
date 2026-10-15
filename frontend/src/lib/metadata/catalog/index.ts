import { PageSchema } from "../types";
import { superadminSchemas } from "./superadmin";
import { administrationSchemas } from "./administration";
import { hrmsSchemas } from "./hrms";
import { payrollSchemas } from "./payroll";
import { financeSchemas } from "./finance";
import { salesSchemas } from "./sales";
import { crmSchemas } from "./crm";
import { inventorySchemas } from "./inventory";
import { procurementSchemas } from "./procurement";
import { manufacturingSchemas, projectSchemas } from "./projects";
import { assetSchemas, workflowSchemas, securitySchemas } from "./assets";
import { integrationsSchemas } from "./integrations";

export const masterSchemaCatalog: Record<string, PageSchema> = {
  ...superadminSchemas,
  ...administrationSchemas,
  ...hrmsSchemas,
  ...payrollSchemas,
  ...financeSchemas,
  ...salesSchemas,
  ...crmSchemas,
  ...inventorySchemas,
  ...procurementSchemas,
  ...manufacturingSchemas,
  ...projectSchemas,
  ...assetSchemas,
  ...workflowSchemas,
  ...securitySchemas,
  ...integrationsSchemas,
};

export const getCatalogSchema = (pageKey: string): PageSchema | null => {
  const normalized = pageKey.toLowerCase().trim();
  if (masterSchemaCatalog[normalized]) {
    return masterSchemaCatalog[normalized];
  }

  // Fuzzy match (e.g. "employees" -> "hrms.employees", "users" -> "administration.users")
  for (const [key, schema] of Object.entries(masterSchemaCatalog)) {
    if (key.endsWith(`.${normalized}`) || key.endsWith(normalized)) {
      return schema;
    }
  }

  return null;
};
