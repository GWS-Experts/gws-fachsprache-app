import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import "./globals.css";

const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GWS Fachsprache Pflege",
  description: "Training für die Fachsprachprüfung Pflege – GWS talent transfer GmbH",
  applicationName: "GWS Fachsprache",
  // iPhone/iPad: als App vom Home-Bildschirm starten (eigenes Fenster, Name unter dem Symbol).
  appleWebApp: { capable: true, title: "GWS Pflege", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b2f63",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={openSans.variable}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
