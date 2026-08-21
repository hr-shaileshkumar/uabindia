import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function LegacyCustomersRedirect() {
  redirect(ROUTES.CUSTOMERS);
}
