import { DynamicPage } from "@/components/dynamic/DynamicPage";
import { AdministrationProfilePage } from "@/components/workspace/administration/profile-page";

export default function ProfilePage() {
  return (
    <DynamicPage
      pageKey="administration.profile"
      fallback={<AdministrationProfilePage />}
      renderMode="auto"
    />
  );
}

