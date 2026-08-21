import { redirect } from "next/navigation";

export default function LegacySecurityDevicesRedirect() {
  redirect("/platform/security/sessions");
}
