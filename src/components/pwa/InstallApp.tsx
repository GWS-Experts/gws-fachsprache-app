"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getInstallPrompt, isIos, isStandalone, subscribeInstallPrompt } from "@/components/pwa/device";

type Mode = "server" | "installed" | "prompt" | "ios" | "other";

const DISMISS_KEY = "gws-install-dismissed";
const noop = () => () => {};

function detect(): Mode {
  if (isStandalone()) return "installed";
  if (getInstallPrompt()) return "prompt";
  if (isIos()) return "ios";
  return "other";
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// "App installieren": als Hinweis auf der Startseite (banner) oder als Karte im Profil (card).
export function InstallApp({ variant }: { variant: "banner" | "card" }) {
  const t = useTranslations("pwa");
  const mode = useSyncExternalStore(subscribeInstallPrompt, detect, () => "server" as Mode);
  const storedDismissed = useSyncExternalStore(noop, readDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  async function install() {
    const prompt = getInstallPrompt();
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
    setInstalling(false);
  }

  if (variant === "banner") {
    if ((mode !== "prompt" && mode !== "ios") || storedDismissed || dismissed) return null;
    const close = () => {
      setDismissed(true);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    };
    return (
      <section className="card flex items-start gap-3 border-accent bg-accent-light">
        <span aria-hidden className="text-2xl">📱</span>
        <div className="flex-1 space-y-2">
          <p className="font-bold text-primary">{t("bannerTitle")}</p>
          <p className="text-sm">{t("bannerText")}</p>
          {mode === "prompt" ? (
            <button className="btn-primary" onClick={install} disabled={installing}>{t("install")}</button>
          ) : (
            <IosSteps />
          )}
        </div>
        <button onClick={close} className="text-sm font-semibold text-muted hover:text-ink" aria-label={t("dismiss")}>✕</button>
      </section>
    );
  }

  if (mode === "server") return null;
  return (
    <section className="card space-y-3">
      <h2 className="font-bold text-primary">{t("cardTitle")}</h2>
      {mode === "installed" && <p className="text-sm text-success">{t("installed")}</p>}
      {mode === "prompt" && (
        <>
          <p className="text-sm">{t("bannerText")}</p>
          <button className="btn-primary" onClick={install} disabled={installing}>{t("install")}</button>
        </>
      )}
      {mode === "ios" && (
        <>
          <p className="text-sm">{t("bannerText")}</p>
          <IosSteps />
        </>
      )}
      {mode === "other" && <p className="text-sm text-muted">{t("otherHint")}</p>}
    </section>
  );
}

function IosSteps() {
  const t = useTranslations("pwa");
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm">
      <li>{t("iosStep1")}</li>
      <li>{t("iosStep2")}</li>
      <li>{t("iosStep3")}</li>
    </ol>
  );
}
