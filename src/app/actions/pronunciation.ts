"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Aussprache-Aufnahme eines Fachbegriffs speichern oder entfernen (nur GWS).
// Die Datei lädt der Browser vorher in den Bucket fsp-media unter glossary/… hoch.
const schema = z.object({
  termId: z.string().uuid(),
  path: z.string().regex(/^glossary\/[0-9a-f-]{36}-\d+\.(webm|ogg|mp3|m4a|wav)$/).nullable(),
});

export async function setTermAudio(input: z.infer<typeof schema>) {
  await requireStaff();
  const v = schema.safeParse(input);
  if (!v.success || (v.data.path && !v.data.path.startsWith(`glossary/${v.data.termId}-`))) return { ok: false };
  const supabase = await createClient();
  const { data: prev } = await supabase.from("glossary_terms").select("audio_path").eq("id", v.data.termId).maybeSingle();
  const { error } = await supabase.from("glossary_terms").update({ audio_path: v.data.path }).eq("id", v.data.termId);
  if (error) return { ok: false };
  const old = (prev as { audio_path?: string | null } | null)?.audio_path;
  if (old && old !== v.data.path) await supabase.storage.from("fsp-media").remove([old]);
  revalidatePath("/admin/content/glossary", "layout");
  revalidatePath("/app/glossary", "layout");
  return { ok: true };
}
