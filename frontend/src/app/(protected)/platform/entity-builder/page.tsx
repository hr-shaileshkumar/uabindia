import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Entity builder uses the same field-definition CRUD as schema manager. */
export default function EntityBuilderPage() {
  redirect(ROUTES.PLATFORM_SCHEMA_MANAGER);
}
