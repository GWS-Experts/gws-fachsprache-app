import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Liefert die Aussprache-Aufnahme eines Fachbegriffs: kurzzeitig gültiger Link in den
// privaten Bucket fsp-media. RLS sorgt dafür, dass nur freigeschaltete Nutzer Begriffe sehen.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse(null, { status: 404 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new NextResponse(null, { status: 401 });

  const { data } = await supabase.from("glossary_terms").select("audio_path").eq("id", id).maybeSingle();
  const path = (data as { audio_path?: string | null } | null)?.audio_path;
  if (!path) return new NextResponse(null, { status: 404 });
  const { data: signed } = await supabase.storage.from("fsp-media").createSignedUrl(path, 600);
  if (!signed?.signedUrl) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
