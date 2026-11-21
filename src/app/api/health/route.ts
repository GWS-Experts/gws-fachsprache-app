import { NextResponse } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Lebenszeichen für die Ausfallüberwachung (scripts/ops/watchdog.mjs und externe Dienste wie UptimeRobot).
// Prüft, ob die App antwortet und die Datenbank erreichbar ist. Gibt keine Inhalte preis.
export async function GET() {
  let db = false;
  if (hasAdminKey()) {
    try {
      const { error } = await createAdminClient()
        .from("modules")
        .select("id", { head: true, count: "exact" })
        .abortSignal(AbortSignal.timeout(8000));
      db = !error;
    } catch {
      db = false;
    }
  }
  return NextResponse.json(
    { ok: db, app: true, db, time: new Date().toISOString() },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
