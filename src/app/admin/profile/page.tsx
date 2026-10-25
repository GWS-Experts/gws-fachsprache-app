import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { ProfileForms } from "@/components/ProfileForms";

export default async function StaffProfilePage() {
  const profile = await requireStaff();
  const t = await getTranslations("profile");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <ProfileForms profile={profile} />
    </div>
  );
}
