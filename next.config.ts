import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Alle Seiten sind nutzerbezogen und werden pro Anfrage gerendert.
  cacheComponents: false,
  // Eigenständiger Build für den Betrieb auf dem Hostinger-VPS (node server.js).
  output: "standalone",
  experimental: {
    serverActions: {
      // Sprachaufnahmen laufen direkt über Supabase Storage, Formulare bleiben klein.
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
