-- Fertige Audiodateien (public/audio) für Hörtexte und Dialoge der drei Beispielmodule.
-- Setzt den Audiopfad nur, wenn noch keine eigene Datei hochgeladen wurde. Kann mehrfach ausgeführt werden.

update fsp.lessons l
set content = jsonb_set(l.content, '{audio_path}', to_jsonb(v.path))
from (values
  ('20000000-0000-4000-8000-000000000102', '/audio/m1-aufnahmegespraech.mp3'),
  ('20000000-0000-4000-8000-000000000202', '/audio/m2-meldung-arzt.mp3'),
  ('20000000-0000-4000-8000-000000000302', '/audio/m3-muendliche-uebergabe.mp3'),
  ('20000000-0000-4000-8000-000000000303', '/audio/m3-ruecksprache-aerztin.mp3')
) as v(id, path)
where l.id = v.id::uuid
  and coalesce(l.content ->> 'audio_path', '') = '';
