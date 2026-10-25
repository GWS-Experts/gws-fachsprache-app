import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

// Client mit Secret Key: umgeht RLS. Nur in Server Actions verwenden,
// nachdem die Rolle des Aufrufers geprüft wurde.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY fehlt in den Umgebungsvariablen.");
  }
  return createClient(SUPABASE_URL, key, {
    db: { schema: "fsp" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasAdminKey() {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}
