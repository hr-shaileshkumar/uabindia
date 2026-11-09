import { redirect } from "next/navigation";

export default function HrmsAssetsRedirect() {
  redirect("/assets?tab=custody");
}
