import { redirect } from "next/navigation";

export default function LegacyDepartmentsRedirect() {
  redirect("/platform/departments");
}
