import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { ProfileForms } from "@/components/ProfileForms";
import { InstallApp } from "@/components/pwa/InstallApp";
import { PushToggle } from "@/components/pwa/PushToggle";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

export default async function CustomerProfilePage() {
  const profile = await requireCustomer();
  const t = await getTranslations("profile");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <ProfileForms profile={profile} />
      <div className="grid gap-6 lg:grid-cols-2">
        <InstallApp variant="card" />
        {pushConfigured() && (
          <section className="card space-y-2">
            <PushToggle publicKey={vapidPublicKey()} />
            <p className="text-xs text-muted">{t("pushInfo")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
