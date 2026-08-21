import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AssetsModuleRedirect() {
  redirect(ROUTES.HR_ASSETS);
}
