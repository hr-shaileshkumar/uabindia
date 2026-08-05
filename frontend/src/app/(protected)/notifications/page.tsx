import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function LegacyNotificationsPage() {
  redirect(ROUTES.ADMINISTRATION_NOTIFICATIONS);
}
