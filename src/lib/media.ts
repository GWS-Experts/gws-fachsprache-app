import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

type WithStorage = { storage: SupabaseClient["storage"] };

// Audiodateien liegen entweder im Speicher "fsp-media" (Upload im Inhaltseditor)
// oder als fertige Datei in public/audio (mit Sprachausgabe erzeugte Hörtexte, Pfad beginnt mit "/").
export async function resolveAudioUrl(supabase: WithStorage, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  const { data } = await supabase.storage.from("fsp-media").createSignedUrl(path, 60 * 60 * 3);
  return data?.signedUrl ?? null;
}
