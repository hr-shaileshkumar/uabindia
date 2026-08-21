import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function LegacyTravelRedirect() {
  redirect(ROUTES.TRAVEL);
}
