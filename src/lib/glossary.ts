import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GlossaryReview, GlossaryTerm, GlossaryTopic } from "@/lib/types";

const PAGE = 1000;

export async function getGlossaryTopics(): Promise<GlossaryTopic[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("glossary_topics").select("*").order("sort").order("title_de");
  return (data as GlossaryTopic[]) ?? [];
}

// Die Data API liefert höchstens 1000 Zeilen pro Abfrage, daher seitenweise laden.
export async function getGlossaryTerms(topicId?: string): Promise<GlossaryTerm[]> {
  const supabase = await createClient();
  const all: GlossaryTerm[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from("glossary_terms").select("*").order("sort").order("term").order("id").range(from, from + PAGE - 1);
    if (topicId) query = query.eq("topic_id", topicId);
    const { data } = await query;
    const rows = (data as GlossaryTerm[]) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

export async function getGlossaryReviews(userId: string): Promise<GlossaryReview[]> {
  const supabase = await createClient();
  const all: GlossaryReview[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("glossary_reviews")
      .select("term_id, known, reviews, updated_at")
      .eq("user_id", userId)
      .order("term_id")
      .range(from, from + PAGE - 1);
    const rows = (data as GlossaryReview[]) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

export interface TopicStat {
  topic: GlossaryTopic;
  total: number;
  known: number;
  learning: number;
}

export function topicStats(topics: GlossaryTopic[], terms: GlossaryTerm[], reviews: GlossaryReview[]): TopicStat[] {
  const byTerm = new Map(reviews.map((r) => [r.term_id, r]));
  return topics.map((topic) => {
    const ts = terms.filter((t) => t.topic_id === topic.id);
    return {
      topic,
      total: ts.length,
      known: ts.filter((t) => byTerm.get(t.id)?.known).length,
      learning: ts.filter((t) => byTerm.get(t.id)?.known === false).length,
    };
  });
}
