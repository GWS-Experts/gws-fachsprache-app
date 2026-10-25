import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

const KNOWN_ERRORS = ["invalid", "no_access", "link"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const t = await getTranslations("login");
  const { error } = await searchParams;
  return (
    <AuthShell title={t("title")} intro={t("intro")}>
      <LoginForm initialError={error && KNOWN_ERRORS.includes(error) ? error : undefined} />
    </AuthShell>
  );
}
