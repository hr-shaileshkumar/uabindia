import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Healthcare pack has no backend module yet — keep out of production nav. */
export default function PlannedHealthcareRedirect() {
  redirect(ROUTES.DASHBOARD);
}
