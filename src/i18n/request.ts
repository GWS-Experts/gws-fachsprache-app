import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["de", "en"] as const;
export const LOCALE_COOKIE = "locale";

export default getRequestConfig(async () => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  const locale = value === "en" ? "en" : "de";

  return {
    locale,
    timeZone: "Europe/Berlin",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
