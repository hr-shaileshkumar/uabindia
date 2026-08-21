import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function PlatformLicensingRedirect() {
  redirect(ROUTES.LICENSING_HOME);
}
