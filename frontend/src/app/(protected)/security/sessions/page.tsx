import { redirect } from "next/navigation";

export default function LegacySecuritySessionsRedirect() {
  redirect("/platform/security/sessions");
}
