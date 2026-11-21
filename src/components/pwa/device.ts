// Geräte-Erkennung für Installation und Push (nur im Browser aufrufen).

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos() {
  const ua = navigator.userAgent;
  // iPadOS meldet sich als Mac, hat aber einen Touchscreen.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Android/Chrome bietet die Installation über das Ereignis "beforeinstallprompt" an.
// Es kommt früh, deshalb fängt es der Service-Worker-Baustein im Root-Layout ab und legt es hier ab.
export type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let installPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function setInstallPrompt(e: InstallPromptEvent | null) {
  installPrompt = e;
  listeners.forEach((l) => l());
}
export function getInstallPrompt() {
  return installPrompt;
}
export function subscribeInstallPrompt(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
