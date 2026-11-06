import { redirect } from "next/navigation";

export default function BookDemoPage() {
  redirect("/contact?type=demo");
}
