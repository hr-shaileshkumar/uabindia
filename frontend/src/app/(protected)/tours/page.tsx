import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/** Tours UI has no backend — fold into HRMS travel. */
export default function LegacyToursRedirect() {
  redirect(ROUTES.TRAVEL);
}
