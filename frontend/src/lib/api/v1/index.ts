/**
 * Thin v1 API facade for frontend modules.
 * New pages should import from here instead of reaching into services/modules directly.
 */
import { hrmsApi } from "@/services/modules/hrms";

export { hrmsApi as hrms } from "@/services/modules/hrms";
export { platformApi as platform } from "@/services/modules/platform";
export const trainingApi = hrmsApi.training;
