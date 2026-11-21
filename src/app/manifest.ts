import type { MetadataRoute } from "next";

// Web-App-Manifest: macht die Trainings-App auf dem Handy installierbar (Startbildschirm, eigenes Fenster).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GWS Fachsprache Pflege",
    short_name: "GWS Pflege",
    description: "Training für die Fachsprachprüfung Pflege – GWS language GmbH",
    lang: "de",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b2f63",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Lernplan", url: "/app/plan", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Fachbegriffe üben", url: "/app/glossary/train", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nachrichten", url: "/app/messages", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
