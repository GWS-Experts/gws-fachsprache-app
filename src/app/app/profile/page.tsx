import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { ProfileForms } from "@/components/ProfileForms";

export default async function CustomerProfilePage() {
  const profile = await requireCustomer();
  const t = await getTranslations("profile");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <ProfileForms profile={profile} />
    </div>
  );
}
