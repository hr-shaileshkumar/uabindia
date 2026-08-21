import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Fleet has no backend module yet — keep out of production nav. */
export default function PlannedFleetRedirect() {
  redirect(ROUTES.DASHBOARD);
}
