import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function LegacyApprovalsPage() {
  redirect(ROUTES.ADMINISTRATION_APPROVALS);
}
