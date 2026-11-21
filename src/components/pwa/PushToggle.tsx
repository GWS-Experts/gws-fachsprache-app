"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/app/actions/push";
import { isIos, isStandalone, pushSupported, urlBase64ToUint8Array } from "@/components/pwa/device";

type Status = "loading" | "unsupported" | "iosInstall" | "denied" | "off" | "on";

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

// Push-Benachrichtigungen auf diesem Gerät ein- oder ausschalten.
export function PushToggle({ publicKey }: { publicKey: string }) {
  const t = useTranslations("push");
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Status;
      if (!pushSupported()) next = isIos() && !isStandalone() ? "iosInstall" : "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        // Vorhandenes Abo dem angemeldeten Nutzer zuordnen (z. B. nach Kontowechsel auf dem Gerät).
        if (sub) await savePushSubscription(sub.toJSON(), navigator.userAgent);
        next = sub ? "on" : "off";
      }
      if (!cancelled) setStatus(next);
    })().catch(() => !cancelled && setStatus("off"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!publicKey) return null;

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const old = await reg.pushManager.getSubscription();
      if (old) await old.unsubscribe();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const res = await savePushSubscription(sub.toJSON(), navigator.userAgent);
      if (!res.ok) {
        await sub.unsubscribe();
        setMessage({ ok: false, text: t("error") });
        return;
      }
      setStatus("on");
      setMessage({ ok: true, text: t("enabled") });
    } catch (e) {
      console.error("Push", e);
      setMessage({ ok: false, text: t("error") });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const res = await sendTestPush();
    setMessage(res.ok ? { ok: true, text: t("testSent") } : { ok: false, text: t("error") });
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t("title")}</p>
      {status === "loading" && <p className="text-sm text-muted">…</p>}
      {status === "unsupported" && <p className="text-sm text-muted">{t("unsupported")}</p>}
      {status === "iosInstall" && <p className="text-sm text-muted">{t("iosInstall")}</p>}
      {status === "denied" && <p className="text-sm text-muted">{t("denied")}</p>}
      {status === "off" && (
        <>
          <p className="text-sm text-muted">{t("offText")}</p>
          <button type="button" className="btn-outline" onClick={enable} disabled={busy}>🔔 {t("enable")}</button>
        </>
      )}
      {status === "on" && (
        <>
          <p className="text-sm text-success">{t("onText")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline" onClick={test} disabled={busy}>{t("test")}</button>
            <button type="button" className="btn-outline" onClick={disable} disabled={busy}>{t("disable")}</button>
          </div>
        </>
      )}
      {message && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </div>
  );
}
