import fs from "node:fs";
import crypto from "node:crypto";
// Erzeugt supabase/seed/fsp_fachbegriffe.sql aus den Listen in supabase/seed/fachbegriffe/.
// Aufruf: node scripts/build-fachbegriffe-seed.mjs supabase/seed/fachbegriffe supabase/seed/fsp_fachbegriffe.sql
// Format pro Zeile: Artikel|Begriff|Plural|Erklärung|Englisch|Beispielsatz.
// Themen beginnen mit: ## slug|Icon|Titel DE|Titel EN|Beschreibung DE|Beschreibung EN
const [dir, out] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort();
const uuid = (s, prefix) => {
  const h = crypto.createHash("md5").update(s).digest("hex");
  return `${prefix}${h.slice(prefix.length, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const q = (s) => "'" + s.replace(/'/g, "''") + "'";
const topics = [];
let cur = null;
for (const f of files) {
  for (const [i, raw] of fs.readFileSync(`${dir}/${f}`, "utf8").split("\n").entries()) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      const [slug, icon, title_de, title_en, description_de, description_en] = line.slice(3).split("|").map((s) => s.trim());
      cur = { slug, icon, title_de, title_en, description_de, description_en, terms: [] };
      topics.push(cur);
      continue;
    }
    const p = line.split("|").map((s) => s.trim());
    if (p.length !== 6) throw new Error(`${f}:${i + 1}: ${p.length} Felder: ${line}`);
    const [article, term, plural, explanation, en, example] = p;
    if (!["", "der", "die", "das"].includes(article)) throw new Error(`${f}:${i + 1}: Artikel ${article}`);
    if (!term || !explanation) throw new Error(`${f}:${i + 1}: leer`);
    if (cur.terms.some((t) => t.term === term)) throw new Error(`${f}:${i + 1}: doppelt ${term}`);
    cur.terms.push({ article, term, plural, explanation, en, example });
  }
}
let sql = `-- Fachwortschatz Pflege für die Fachsprachprüfung (B2): ${topics.length} Themen, ${topics.reduce((s, t) => s + t.terms.length, 0)} Begriffe.
-- Erzeugt mit scripts/build-fachbegriffe-seed.mjs aus supabase/seed/fachbegriffe/. Kann mehrfach ausgeführt werden (bestehende Einträge werden aktualisiert,
-- später im Inhaltseditor ergänzte Begriffe bleiben erhalten).

insert into fsp.glossary_topics (id, slug, icon, title_de, title_en, description_de, description_en, sort, published) values
${topics.map((t, i) => `(${q(uuid("topic:" + t.slug, "3"))}, ${q(t.slug)}, ${q(t.icon)}, ${q(t.title_de)}, ${q(t.title_en)}, ${q(t.description_de)}, ${q(t.description_en)}, ${i + 1}, true)`).join(",\n")}
on conflict (id) do update set slug = excluded.slug, icon = excluded.icon, title_de = excluded.title_de, title_en = excluded.title_en,
  description_de = excluded.description_de, description_en = excluded.description_en, sort = excluded.sort;
`;
for (const t of topics) {
  sql += `\n-- ${t.title_de} (${t.terms.length})\ninsert into fsp.glossary_terms (id, topic_id, article, term, plural, explanation, en, example, sort) values\n`;
  sql += t.terms.map((x, i) => `(${q(uuid(`term:${t.slug}:${x.term}`, "4"))}, ${q(uuid("topic:" + t.slug, "3"))}, ${q(x.article)}, ${q(x.term)}, ${q(x.plural)}, ${q(x.explanation)}, ${q(x.en)}, ${q(x.example)}, ${i + 1})`).join(",\n");
  sql += `\non conflict (id) do update set article = excluded.article, term = excluded.term, plural = excluded.plural,\n  explanation = excluded.explanation, en = excluded.en, example = excluded.example, sort = excluded.sort;\n`;
}
fs.writeFileSync(out, sql);
console.log(topics.map((t) => `${t.slug}: ${t.terms.length}`).join("\n"), "\nTotal", topics.reduce((s, t) => s + t.terms.length, 0));
