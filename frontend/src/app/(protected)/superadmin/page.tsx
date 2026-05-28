import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function SuperAdminRootRedirect() {
  redirect(ROUTES.SUPERADMIN_DASHBOARD);
}
