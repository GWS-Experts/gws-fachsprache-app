"use client";

import { useEffect } from "react";
import { setInstallPrompt, type InstallPromptEvent } from "@/components/pwa/device";

// Meldet den Service Worker an (Installierbarkeit, Offline-Hinweis, Push) und merkt sich das
// Installationsangebot des Browsers. Lokal im Entwicklungsmodus ohne Service Worker,
// damit Änderungen sofort sichtbar sind.
export function ServiceWorker() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => console.error("Service Worker", e));
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
