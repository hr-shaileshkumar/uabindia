import { redirect } from "next/navigation";

export default function NotificationsInboxRedirect() {
  redirect("/communication?tab=feed");
}
