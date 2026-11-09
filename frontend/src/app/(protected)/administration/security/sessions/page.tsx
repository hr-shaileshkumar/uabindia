import { redirect } from "next/navigation";

export default function SecuritySessionsRedirect() {
  redirect("/security/access-logs");
}
