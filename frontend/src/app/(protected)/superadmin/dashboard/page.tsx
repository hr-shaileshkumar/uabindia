import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function SuperAdminDashboard() {
  redirect(ROUTES.PLATFORM_HOME);
}
