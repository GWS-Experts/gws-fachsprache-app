-- Weitere Übungsmodule für typische Prüfungssituationen (Pflege B2):
-- Schichtübergabe, Pflegedokumentation, Telefonat mit Ärztin/Arzt, Angehörigengespräch, Pflegebericht.
-- Kann mehrfach ausgeführt werden (bestehende Einträge mit diesen IDs werden überschrieben).
-- Hörtexte und Dialoge haben fertige Audiodateien in public/audio (erzeugt mit scripts/generate-audio.py).

insert into fsp.modules (id, slug, title_de, title_en, description_de, description_en, sort, published) values
('10000000-0000-4000-8000-000000000004', 'schichtuebergabe', 'Schichtübergabe im Team', 'Shift handover in the team',
 'Mehrere Patienten strukturiert übergeben, gezielt nachfragen und Aufgaben für die nächste Schicht klar benennen.',
 'Hand over several patients in a structured way, ask targeted questions and name clear tasks for the next shift.', 4, true),
('10000000-0000-4000-8000-000000000005', 'pflegedokumentation', 'Pflegedokumentation', 'Nursing documentation',
 'Beobachtungen, Maßnahmen und Ereignisse wie Stürze oder Wunden sachlich, vollständig und rechtssicher dokumentieren.',
 'Document observations, measures and events such as falls or wounds objectively, completely and in a legally sound way.', 5, true),
('10000000-0000-4000-8000-000000000006', 'arzt-telefonat', 'Telefonat mit Ärztin und Arzt', 'Phone call with the doctor',
 'Mit dem SBAR-Schema anrufen, Werte durchgeben, Anordnungen wiederholen und richtig dokumentieren.',
 'Call using SBAR, report values, repeat orders back and document them correctly.', 6, true),
('10000000-0000-4000-8000-000000000007', 'angehoerigengespraech', 'Gespräche mit Angehörigen', 'Talking to relatives',
 'Angehörige informieren, Schweigepflicht beachten, mit Sorgen und Beschwerden einfühlsam umgehen.',
 'Inform relatives, respect confidentiality and respond empathetically to worries and complaints.', 7, true),
('10000000-0000-4000-8000-000000000008', 'pflegebericht', 'Pflegebericht schreiben', 'Writing the nursing report',
 'Aufbau, typische Formulierungen und Zeitformen des Pflegeberichts – mit Schreibaufgaben wie in der Prüfung.',
 'Structure, typical phrases and tenses of the nursing report – with writing tasks as in the exam.', 8, true)
on conflict (id) do update set slug = excluded.slug, title_de = excluded.title_de, title_en = excluded.title_en,
  description_de = excluded.description_de, description_en = excluded.description_en, sort = excluded.sort, published = excluded.published;

insert into fsp.lessons (id, module_id, kind, title_de, title_en, sort, published, content) values

-- Modul 4: Schichtübergabe im Team ---------------------------------------------
('20000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000004', 'vocabulary',
 'Wortschatz: Übergabe', 'Vocabulary: handover', 1, true, $j${
  "intro_de": "Diese Wörter hörst du in fast jeder Übergabe. Lerne Artikel und Plural mit.",
  "intro_en": "You will hear these words in almost every handover. Learn the article and plural too.",
  "items": [
    {"article": "die", "term": "Übergabe", "plural": "die Übergaben", "en": "handover", "example": "Die Übergabe findet um 13:30 Uhr im Stationszimmer statt."},
    {"article": "der", "term": "Frühdienst", "plural": "die Frühdienste", "en": "early shift", "example": "Im Frühdienst sind wir heute zu dritt."},
    {"article": "der", "term": "Spätdienst", "plural": "die Spätdienste", "en": "late shift", "example": "Der Spätdienst übernimmt die Blutzuckermessung um 17 Uhr."},
    {"article": "der", "term": "Nachtdienst", "plural": "die Nachtdienste", "en": "night shift", "example": "Der Nachtdienst soll alle zwei Stunden lagern."},
    {"article": "die", "term": "Bedarfsmedikation", "plural": "", "en": "as-needed medication (PRN)", "example": "Bei Schmerzen bekommt er Novalgin als Bedarfsmedikation."},
    {"article": "die", "term": "Lagerung", "plural": "die Lagerungen", "en": "positioning", "example": "Die Lagerung erfolgt im Wechsel rechts, Rücken, links."},
    {"article": "die", "term": "Ausscheidung", "plural": "die Ausscheidungen", "en": "excretion (urine/stool)", "example": "Die Ausscheidung ist unauffällig, letzter Stuhlgang gestern."},
    {"article": "die", "term": "Flüssigkeitsbilanz", "plural": "die Flüssigkeitsbilanzen", "en": "fluid balance", "example": "Bitte die Flüssigkeitsbilanz bis 6 Uhr weiterführen."},
    {"article": "die", "term": "Verlegung", "plural": "die Verlegungen", "en": "transfer (to another ward)", "example": "Die Verlegung auf die Intensivstation ist für 15 Uhr geplant."},
    {"article": "die", "term": "Entlassung", "plural": "die Entlassungen", "en": "discharge", "example": "Die Entlassung nach Hause ist für Freitag geplant."},
    {"article": "", "term": "nüchtern", "plural": "", "en": "fasting / nil by mouth", "example": "Herr Berger bleibt ab Mitternacht nüchtern für die OP."},
    {"article": "", "term": "zeitnah", "plural": "", "en": "promptly", "example": "Bitte zeitnah den Verband kontrollieren."}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000402', '10000000-0000-4000-8000-000000000004', 'listening',
 'Hören: Übergabe an den Spätdienst', 'Listening: handover to the late shift', 2, true, $j${
  "intro_de": "Pflegefachfrau Sabine übergibt zwei Patienten an ihren Kollegen Tomasz. Du hörst den Text höchstens zweimal – notiere dir die wichtigsten Informationen.",
  "intro_en": "Nurse Sabine hands over two patients to her colleague Tomasz. Listen at most twice and take notes.",
  "transcript": "Sabine: So, Tomasz, dann fangen wir mit Zimmer 3 an. Das ist Herr Berger, 67 Jahre alt. Er ist heute Morgen mit einem Verdacht auf Gallensteine gekommen.\nTomasz: Ist die Operation schon geplant?\nSabine: Ja, morgen früh um 8 Uhr. Er muss ab Mitternacht nüchtern bleiben. Trinken darf er bis 6 Uhr noch klare Flüssigkeit.\nTomasz: Hat er Schmerzen?\nSabine: Am Vormittag hatte er Schmerzen im rechten Oberbauch, Stärke 6. Um 11 Uhr hat er Metamizol bekommen, jetzt gibt er eine 2 an. Die Bedarfsmedikation darfst du frühestens um 17 Uhr wieder geben.\nTomasz: Gut. Und Zimmer 4?\nSabine: Zimmer 4 ist Frau Petrović, 81 Jahre, Zustand nach Schlaganfall. Sie ist rechts gelähmt und braucht bei allem Unterstützung. Sie wird alle zwei Stunden gelagert, zuletzt um 12 Uhr auf die linke Seite.\nTomasz: Isst und trinkt sie selbst?\nSabine: Nein, sie hat eine Schluckstörung. Sie bekommt angedickte Getränke und pürierte Kost. Bitte unbedingt die Trinkmenge aufschreiben, heute hat sie erst 600 Milliliter getrunken.\nTomasz: Das ist wenig. Gibt es sonst noch etwas?\nSabine: Ja, ihr Sohn kommt um 16 Uhr. Er möchte mit der Ärztin über die Reha sprechen. Ich habe Dr. Aydin schon Bescheid gesagt.",
  "max_plays": 2,
  "questions": [
    {"type": "mc", "prompt": "Warum ist Herr Berger im Krankenhaus?", "options": ["Wegen eines Schlaganfalls", "Wegen Verdacht auf Gallensteine", "Wegen einer Lungenentzündung", "Nach einem Sturz"], "answer": 1},
    {"type": "gap", "prompt": "Herr Berger muss ab ___ nüchtern bleiben.", "answer": "Mitternacht", "alternatives": ["24 Uhr", "0 Uhr", "null Uhr"]},
    {"type": "mc", "prompt": "Wann darf Herr Berger frühestens wieder ein Schmerzmittel bekommen?", "options": ["Sofort", "Um 14 Uhr", "Um 17 Uhr", "Morgen früh"], "answer": 2},
    {"type": "mc", "prompt": "Wie wurde Frau Petrović zuletzt gelagert?", "options": ["Auf dem Rücken", "Auf der rechten Seite", "Auf der linken Seite", "Im Sitzen"], "answer": 2},
    {"type": "gap", "prompt": "Frau Petrović hat heute erst ___ Milliliter getrunken.", "answer": "600"},
    {"type": "mc", "prompt": "Worüber möchte der Sohn mit der Ärztin sprechen?", "options": ["Über die Operation", "Über die Reha", "Über die Medikamente", "Über eine Beschwerde"], "answer": 1}
  ],
  "audio_path": "/audio/m4-uebergabe-spaetdienst.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000403', '10000000-0000-4000-8000-000000000004', 'dialogue',
 'Dialog: Nachfragen bei der Übergabe', 'Dialogue: asking questions in the handover', 3, true, $j${
  "intro_de": "In einer guten Übergabe fragt die übernehmende Pflegekraft nach, wenn etwas unklar ist. Achte auf die Formulierungen.",
  "intro_en": "In a good handover the receiving nurse asks when something is unclear. Pay attention to the phrases.",
  "lines": [
    {"speaker": "Nachtdienst", "text": "Zimmer 8, Herr Wolf, 74 Jahre. Er hatte in der Nacht einen Blutzucker von 58."},
    {"speaker": "Frühdienst", "text": "Entschuldigung, habe ich das richtig verstanden: 58 Milligramm pro Deziliter?"},
    {"speaker": "Nachtdienst", "text": "Genau. Er war verschwitzt und etwas verwirrt. Ich habe ihm Traubenzucker und einen Saft gegeben."},
    {"speaker": "Frühdienst", "text": "Und wie hoch war der Wert danach?"},
    {"speaker": "Nachtdienst", "text": "Nach 15 Minuten lag er bei 112. Um 5 Uhr waren es 134."},
    {"speaker": "Frühdienst", "text": "Wurde der Arzt informiert?"},
    {"speaker": "Nachtdienst", "text": "Ja, Dr. Krämer weiß Bescheid. Er möchte, dass wir das Insulin heute früh erst nach Rücksprache geben."},
    {"speaker": "Frühdienst", "text": "Alles klar. Dann messe ich vor dem Frühstück und rufe ihn an, bevor ich Insulin gebe. Steht das schon in der Dokumentation?"},
    {"speaker": "Nachtdienst", "text": "Ja, alles ist im Verlauf dokumentiert, auch die Uhrzeiten."}
  ],
  "questions": [
    {"type": "mc", "prompt": "Was war das Problem bei Herrn Wolf?", "options": ["Zu hoher Blutzucker", "Zu niedriger Blutzucker", "Hoher Blutdruck", "Fieber"], "answer": 1},
    {"type": "mc", "prompt": "Mit welcher Frage sichert die Frühdienst-Pflegekraft eine Information ab?", "options": ["„Gibt es sonst noch etwas?“", "„Habe ich das richtig verstanden …?“", "„Wie geht es Ihnen?“", "„Wer hat heute Dienst?“"], "answer": 1},
    {"type": "gap", "prompt": "Das Insulin soll heute erst nach ___ mit dem Arzt gegeben werden.", "answer": "Rücksprache"},
    {"type": "mc", "prompt": "Was will der Frühdienst vor dem Frühstück tun?", "options": ["Den Blutzucker messen", "Den Patienten entlassen", "Die Angehörigen anrufen", "Insulin sofort geben"], "answer": 0}
  ],
  "audio_path": "/audio/m4-nachfragen.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000004', 'quiz',
 'Quiz: Redemittel für die Übergabe', 'Quiz: useful phrases for the handover', 4, true, $j${
  "intro_de": "Welche Formulierung passt? Achte auf sachliche, klare Sprache.",
  "intro_en": "Which phrase fits? Pay attention to clear, objective language.",
  "questions": [
    {"type": "mc", "prompt": "Wie beginnst du die Übergabe eines Patienten?", "options": ["„Der Typ in Zimmer 5 nervt.“", "„Zimmer 5, Herr Ali, 59 Jahre, Tag 1 nach Blinddarm-OP.“", "„Na ja, da ist halt noch einer.“", "„Den kennt ihr ja alle.“"], "answer": 1},
    {"type": "gap", "prompt": "Bitte den Verband ___ (zeitnah / zeitlich) kontrollieren, er war um 12 Uhr leicht durchgeblutet.", "answer": "zeitnah"},
    {"type": "mc", "prompt": "Wie gibst du eine Aufgabe an die nächste Schicht weiter?", "options": ["„Vielleicht könnte man irgendwann mal …“", "„Bitte um 18 Uhr den Blutdruck messen und dokumentieren.“", "„Das macht ihr schon.“", "„Keine Ahnung, schaut selbst.“"], "answer": 1},
    {"type": "gap", "prompt": "Herr Ali hat seit der OP noch kein Wasser gelassen. Bitte die ___ beobachten.", "answer": "Ausscheidung", "alternatives": ["Urinausscheidung"]},
    {"type": "mc", "prompt": "Was bedeutet „Zustand nach (Z. n.) Schlaganfall“?", "options": ["Der Patient hat gerade einen Schlaganfall.", "Der Patient hatte früher einen Schlaganfall.", "Der Patient hat Angst vor einem Schlaganfall.", "Ein Schlaganfall ist geplant."], "answer": 1},
    {"type": "mc", "prompt": "Welche Information gehört NICHT in die Übergabe?", "options": ["Allergien", "Geplante Untersuchungen", "Persönliche Meinung über die Familie", "Aktuelle Vitalwerte"], "answer": 2}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000405', '10000000-0000-4000-8000-000000000004', 'writing',
 'Schreiben: Übergabenotiz für den Nachtdienst', 'Writing: handover note for the night shift', 5, true, $j${
  "intro_de": "Manchmal muss die Übergabe schriftlich erfolgen, zum Beispiel wenn du früher gehen musst.",
  "intro_en": "Sometimes the handover has to be written, for example if you have to leave early.",
  "task_de": "Du musst heute eine Stunde früher gehen. Schreibe für den Nachtdienst eine Übergabenotiz zu Frau Petrović (Zimmer 4). Nutze die Stichpunkte im Material und formuliere ganze Sätze.",
  "task_en": "You have to leave an hour early today. Write a handover note for the night shift about Mrs Petrović (room 4). Use the notes in the material and write full sentences.",
  "text": "Material:\n- Frau Ana Petrović, 81 J., Z. n. Schlaganfall, Hemiparese rechts\n- Schluckstörung: angedickte Getränke, pürierte Kost\n- Trinkmenge heute bis 20 Uhr: 1000 ml (Ziel 1500 ml)\n- Lagerung alle 2 Std., zuletzt 20 Uhr Rückenlage\n- Gesäß: Haut gerötet, nicht wegdrückbar (Dekubitus Kategorie 1?), Foto im System\n- Sohn hat angerufen, kommt morgen 10 Uhr\n- Ärztin informiert über Hautrötung, Wundmanager morgen",
  "hints": ["Wer? Name, Alter, Diagnose", "Was ist heute passiert?", "Was ist besonders wichtig (Haut, Trinkmenge)?", "Welche Aufgaben hat der Nachtdienst?"],
  "min_words": 100
}$j$::jsonb),

('20000000-0000-4000-8000-000000000406', '10000000-0000-4000-8000-000000000004', 'speaking',
 'Sprechen: Zwei Patienten übergeben', 'Speaking: hand over two patients', 6, true, $j${
  "intro_de": "In der Prüfung sollst du eine Übergabe frei und strukturiert halten.",
  "intro_en": "In the exam you have to give a handover freely and in a structured way.",
  "task_de": "Übergib die beiden Patienten an den Spätdienst. Sprich etwa zwei Minuten. Nenne zu jedem Patienten Name, Alter, Diagnose, aktuellen Zustand und offene Aufgaben.",
  "task_en": "Hand over both patients to the late shift. Speak for about two minutes. For each patient give name, age, diagnosis, current condition and open tasks.",
  "text": "Zimmer 1: Herr Klaus Ritter, 72 J., Herzinsuffizienz. Heute 1,5 kg Gewichtszunahme, Beine geschwollen. Arzt hat Furosemid erhöht. Flüssigkeitsbilanz führen, max. 1,5 l Trinkmenge.\n\nZimmer 2: Frau Leyla Demir, 45 J., Tag 1 nach Gebärmutter-OP. Schmerzen 3/10, mobilisiert bis zum Stuhl. Blasenkatheter wird um 16 Uhr entfernt, danach Wasserlassen beobachten.",
  "hints": ["Zimmer 1, Herr Ritter, 72 Jahre …", "Heute ist aufgefallen, dass …", "Der Arzt hat angeordnet, dass …", "Für euch ist wichtig: Bitte …"],
  "max_seconds": 180
}$j$::jsonb),

-- Modul 5: Pflegedokumentation ------------------------------------------------
('20000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000005', 'vocabulary',
 'Wortschatz: Dokumentation', 'Vocabulary: documentation', 1, true, $j${
  "intro_de": "Wichtige Begriffe und Abkürzungen aus der Pflegedokumentation.",
  "intro_en": "Important terms and abbreviations from nursing documentation.",
  "items": [
    {"article": "die", "term": "Pflegeplanung", "plural": "die Pflegeplanungen", "en": "care plan", "example": "Die Pflegeplanung wird bei jeder Veränderung angepasst."},
    {"article": "der", "term": "Pflegebericht", "plural": "die Pflegeberichte", "en": "nursing report / progress notes", "example": "Im Pflegebericht steht, dass die Patientin gut geschlafen hat."},
    {"article": "die", "term": "Vitalzeichenkurve", "plural": "die Vitalzeichenkurven", "en": "vital signs chart", "example": "Trag den Blutdruck bitte in die Vitalzeichenkurve ein."},
    {"article": "das", "term": "Sturzprotokoll", "plural": "die Sturzprotokolle", "en": "fall report", "example": "Nach jedem Sturz wird ein Sturzprotokoll ausgefüllt."},
    {"article": "die", "term": "Wunddokumentation", "plural": "die Wunddokumentationen", "en": "wound documentation", "example": "Zur Wunddokumentation gehören Größe, Aussehen und ein Foto."},
    {"article": "der", "term": "Dekubitus", "plural": "die Dekubitus / Dekubiti", "en": "pressure ulcer", "example": "Am Steißbein hat sich ein Dekubitus Kategorie 2 entwickelt."},
    {"article": "die", "term": "Anordnung", "plural": "die Anordnungen", "en": "(doctor's) order", "example": "Laut ärztlicher Anordnung wird das Antibiotikum abgesetzt."},
    {"article": "das", "term": "Handzeichen", "plural": "die Handzeichen", "en": "initials / signature", "example": "Jeder Eintrag bekommt Datum, Uhrzeit und Handzeichen."},
    {"article": "", "term": "verabreichen", "plural": "", "en": "to administer", "example": "Um 8 Uhr wurden 500 mg Paracetamol verabreicht."},
    {"article": "", "term": "unauffällig", "plural": "", "en": "normal / unremarkable", "example": "Die Vitalzeichen waren im Frühdienst unauffällig."},
    {"article": "", "term": "b. B. (bei Bedarf)", "plural": "", "en": "as needed (PRN)", "example": "Ibuprofen 400 mg b. B., maximal dreimal täglich."},
    {"article": "", "term": "o. B. (ohne Befund)", "plural": "", "en": "no abnormal findings", "example": "Haut o. B., keine Rötungen."}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000005', 'reading',
 'Lesen: Ein Sturzprotokoll', 'Reading: a fall report', 2, true, $j${
  "intro_de": "Lies das Sturzprotokoll genau und beantworte die Fragen.",
  "intro_en": "Read the fall report carefully and answer the questions.",
  "text": "Sturzprotokoll – Station 3A\n\nPatient: Herr Günter Lehmann, geb. 14.02.1941, Zimmer 12\nDatum/Uhrzeit des Sturzes: 18.11., ca. 03:15 Uhr\nOrt: Badezimmer, Zimmer 12\n\nHergang: Herr Lehmann wollte nachts ohne Hilfe zur Toilette gehen. Er hat die Klingel nicht benutzt und den Rollator nicht mitgenommen. Laut eigener Aussage ist er auf dem nassen Boden ausgerutscht. Der Sturz wurde nicht beobachtet; die Pflegekraft fand ihn um 03:20 Uhr sitzend auf dem Boden.\n\nBefund: Patient wach und orientiert. Hämatom am rechten Unterarm, ca. 4 x 3 cm. Keine Schmerzen in Hüfte oder Kopf angegeben. RR 145/85 mmHg, Puls 92/min, BZ 121 mg/dl.\n\nMaßnahmen: Mit zwei Pflegekräften ins Bett geholfen. Unterarm gekühlt. Dienstarzt Dr. Nowak um 03:30 Uhr informiert, Untersuchung um 03:50 Uhr: keine Fraktur vermutet, Röntgen nicht notwendig. Neurologische Kontrolle alle 2 Stunden bis 11 Uhr angeordnet.\n\nPrävention: Nachtlicht eingeschaltet, Rollator in Reichweite gestellt, Klingel erneut erklärt. Sturzrisiko in der Pflegeplanung angepasst. Tochter wurde um 08:00 Uhr telefonisch informiert.\n\nHandzeichen: MK",
  "questions": [
    {"type": "mc", "prompt": "Warum ist Herr Lehmann gestürzt?", "options": ["Er ist aus dem Bett gefallen.", "Er ist auf dem nassen Boden ausgerutscht.", "Ihm war schwindelig.", "Er ist über den Rollator gestolpert."], "answer": 1},
    {"type": "mc", "prompt": "Hat jemand den Sturz gesehen?", "options": ["Ja, die Pflegekraft.", "Ja, der Zimmernachbar.", "Nein, der Sturz wurde nicht beobachtet.", "Ja, die Tochter."], "answer": 2},
    {"type": "gap", "prompt": "Am rechten Unterarm hat Herr Lehmann ein ___.", "answer": "Hämatom", "alternatives": ["Haematom", "Hämatom von 4 x 3 cm"]},
    {"type": "mc", "prompt": "Was hat der Arzt angeordnet?", "options": ["Ein Röntgenbild", "Neurologische Kontrollen alle 2 Stunden", "Bettruhe für eine Woche", "Ein Schmerzmittel"], "answer": 1},
    {"type": "mc", "prompt": "Welche Maßnahme zur Sturzprävention steht NICHT im Protokoll?", "options": ["Nachtlicht eingeschaltet", "Rollator in Reichweite", "Bettgitter hochgezogen", "Klingel erklärt"], "answer": 2},
    {"type": "gap", "prompt": "Die Tochter wurde um ___ Uhr informiert.", "answer": "8", "alternatives": ["08:00", "8:00", "08.00", "acht"]}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000005', 'listening',
 'Hören: Was muss dokumentiert werden?', 'Listening: what has to be documented?', 3, true, $j${
  "intro_de": "Die Praxisanleiterin Frau Keller erklärt einer neuen Kollegin, worauf es bei der Dokumentation ankommt.",
  "intro_en": "The practice instructor Ms Keller explains to a new colleague what matters in documentation.",
  "transcript": "Frau Keller: Mariam, du fragst, warum wir so viel dokumentieren müssen. Ganz einfach: Was nicht dokumentiert ist, gilt als nicht gemacht. Das ist wichtig für die Kollegen, für die Ärzte und im Ernstfall auch vor Gericht.\nMariam: Und was genau muss ich alles aufschreiben?\nFrau Keller: Alle Maßnahmen, die du durchführst, alle Beobachtungen, die vom Normalen abweichen, und alle Gespräche mit Ärzten oder Angehörigen, wenn sie wichtig sind. Immer mit Datum, Uhrzeit und deinem Handzeichen.\nMariam: Darf ich auch schreiben, wenn ich denke, dass ein Patient schlecht gelaunt ist?\nFrau Keller: Schreib lieber, was du siehst und hörst. Also nicht: Der Patient ist schlecht gelaunt. Sondern: Der Patient lehnt die Körperpflege ab und sagt, er möchte in Ruhe gelassen werden. Das ist sachlich und nachvollziehbar.\nMariam: Und wenn ich mich verschrieben habe?\nFrau Keller: Dann streichst du den Fehler mit einem Strich durch, sodass man ihn noch lesen kann, und schreibst die Korrektur daneben. Niemals Tipp-Ex benutzen oder etwas unleserlich machen. In der elektronischen Dokumentation machst du einen Korrektureintrag.\nMariam: Und wann dokumentiere ich? Am Ende der Schicht?\nFrau Keller: Nein, möglichst zeitnah, also direkt nach der Maßnahme. Am Ende der Schicht hat man vieles schon vergessen.",
  "max_plays": 2,
  "questions": [
    {"type": "mc", "prompt": "Was sagt Frau Keller über nicht dokumentierte Maßnahmen?", "options": ["Sie sind nicht so wichtig.", "Sie gelten als nicht gemacht.", "Sie können später ergänzt werden.", "Sie werden vom Arzt dokumentiert."], "answer": 1},
    {"type": "mc", "prompt": "Welche Angaben gehören immer zu einem Eintrag?", "options": ["Name des Arztes und Zimmernummer", "Datum, Uhrzeit und Handzeichen", "Diagnose und Alter", "Nur die Uhrzeit"], "answer": 1},
    {"type": "mc", "prompt": "Welcher Eintrag ist sachlich?", "options": ["„Patient ist schlecht gelaunt.“", "„Patient ist unmöglich.“", "„Patient lehnt die Körperpflege ab und möchte in Ruhe gelassen werden.“", "„Patient hat wohl keine Lust.“"], "answer": 2},
    {"type": "gap", "prompt": "Einen Fehler streicht man mit einem ___ durch, sodass man ihn noch lesen kann.", "answer": "Strich"},
    {"type": "mc", "prompt": "Wann soll man dokumentieren?", "options": ["Am Ende der Schicht", "Einmal pro Woche", "Möglichst zeitnah nach der Maßnahme", "Nur wenn der Arzt es verlangt"], "answer": 2}
  ],
  "audio_path": "/audio/m5-dokumentation.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000504', '10000000-0000-4000-8000-000000000005', 'quiz',
 'Quiz: Sachlich oder wertend?', 'Quiz: objective or judgemental?', 4, true, $j${
  "intro_de": "In der Dokumentation beschreibst du Beobachtungen – keine Meinungen. Wähle die richtige Formulierung.",
  "intro_en": "In documentation you describe observations, not opinions. Choose the correct phrase.",
  "questions": [
    {"type": "mc", "prompt": "Welcher Eintrag ist richtig?", "options": ["„Pat. hat kaum was gegessen.“", "„Pat. hat 1/4 der Mittagsportion gegessen.“", "„Pat. isst wie ein Vogel.“", "„Essen war schlecht.“"], "answer": 1},
    {"type": "mc", "prompt": "Welcher Eintrag beschreibt Schmerzen korrekt?", "options": ["„Pat. jammert ständig.“", "„Pat. gibt Schmerzen im li. Knie an, NRS 6/10.“", "„Pat. übertreibt mit den Schmerzen.“", "„Schmerzen wie immer.“"], "answer": 1},
    {"type": "gap", "prompt": "Wundgröße: 3 x 2 ___ (Maßeinheit)", "answer": "cm", "alternatives": ["Zentimeter"]},
    {"type": "mc", "prompt": "Was bedeutet „NRS“?", "options": ["Numerische Rating-Skala (Schmerzskala von 0 bis 10)", "Notfall-Rettungs-Service", "Nicht reanimieren", "Nierenschaden"], "answer": 0},
    {"type": "mc", "prompt": "Welcher Eintrag ist vollständig?", "options": ["„Verband gewechselt.“", "„20.11., 10:15 Uhr: Verbandwechsel re. Unterschenkel, Wunde 2 x 1 cm, wenig seröses Exsudat, Wundränder reizlos. – AB“", "„Wunde besser.“", "„VW gemacht, alles gut.“"], "answer": 1},
    {"type": "gap", "prompt": "„Der Patient ___ (verweigern, Präteritum) die Medikamente um 8 Uhr.“", "answer": "verweigerte"},
    {"type": "mc", "prompt": "Wie korrigierst du einen Fehler in der Papierdokumentation?", "options": ["Mit Tipp-Ex", "Schwärzen, bis man nichts mehr lesen kann", "Einmal durchstreichen, Korrektur mit Handzeichen daneben", "Seite herausreißen"], "answer": 2}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000505', '10000000-0000-4000-8000-000000000005', 'writing',
 'Schreiben: Wunddokumentation', 'Writing: wound documentation', 5, true, $j${
  "intro_de": "Beschreibe eine Wunde so genau, dass Kolleginnen und Kollegen die Entwicklung beurteilen können.",
  "intro_en": "Describe a wound so precisely that colleagues can judge how it develops.",
  "task_de": "Schreibe einen Eintrag in die Wunddokumentation für Herrn Schmid. Nutze die Notizen aus dem Material und schreibe vollständige, sachliche Sätze.",
  "task_en": "Write an entry in the wound documentation for Mr Schmid. Use the notes in the material and write complete, objective sentences.",
  "text": "Notizen vom Verbandwechsel, 20.11., 9:30 Uhr:\n- Herr Josef Schmid, 79 J., Diabetes Typ 2\n- Wunde: Ferse links, ca. 3 x 2,5 cm, ca. 0,5 cm tief\n- Wundgrund gelblich belegt, Wundrand gerötet\n- mäßig Exsudat, leicht übelriechend\n- Schmerzen beim Verbandwechsel NRS 4\n- Temperatur 37,8 °C\n- Wunde mit NaCl 0,9 % gespült, Schaumverband\n- Foto gemacht, Ärztin Dr. Brandt informiert: Abstrich angeordnet",
  "hints": ["Ort, Größe und Tiefe der Wunde", "Aussehen: Wundgrund, Wundrand, Exsudat, Geruch", "Durchgeführte Maßnahmen", "Information an die Ärztin und Anordnung"],
  "min_words": 80
}$j$::jsonb),

('20000000-0000-4000-8000-000000000506', '10000000-0000-4000-8000-000000000005', 'speaking',
 'Sprechen: Einen Sturz melden', 'Speaking: reporting a fall', 6, true, $j${
  "intro_de": "Nach einem Sturz informierst du die Stationsleitung mündlich.",
  "intro_en": "After a fall you inform the ward manager verbally.",
  "task_de": "Du hast Herrn Lehmann nachts auf dem Boden gefunden (siehe Lektion „Lesen: Ein Sturzprotokoll“). Berichte der Stationsleitung am Morgen, was passiert ist, was du gemacht hast und welche Maßnahmen jetzt geplant sind.",
  "task_en": "You found Mr Lehmann on the floor at night (see lesson \"Reading: a fall report\"). Tell the ward manager in the morning what happened, what you did and which measures are now planned.",
  "hints": ["Wann und wo ist es passiert?", "Wie hast du ihn gefunden, welche Verletzungen?", "Wen hast du informiert, was wurde angeordnet?", "Was tun wir, damit es nicht wieder passiert?"],
  "max_seconds": 150
}$j$::jsonb),

-- Modul 6: Telefonat mit Ärztin und Arzt ----------------------------------------
('20000000-0000-4000-8000-000000000601', '10000000-0000-4000-8000-000000000006', 'vocabulary',
 'Wortschatz: Am Telefon mit dem Arzt', 'Vocabulary: on the phone with the doctor', 1, true, $j${
  "intro_de": "Diese Wörter und Wendungen brauchst du, wenn du eine Ärztin oder einen Arzt anrufst.",
  "intro_en": "You need these words and phrases when you call a doctor.",
  "items": [
    {"article": "der", "term": "Dienstarzt", "plural": "die Dienstärzte", "en": "doctor on duty", "example": "Nachts rufe ich den Dienstarzt über das Diensttelefon an."},
    {"article": "der", "term": "Rückruf", "plural": "die Rückrufe", "en": "call back", "example": "Ich bitte um Rückruf unter der Nummer 4512."},
    {"article": "die", "term": "Verschlechterung", "plural": "die Verschlechterungen", "en": "deterioration", "example": "Ich rufe wegen einer akuten Verschlechterung an."},
    {"article": "die", "term": "Sauerstoffsättigung", "plural": "", "en": "oxygen saturation", "example": "Die Sauerstoffsättigung liegt bei 89 Prozent."},
    {"article": "der", "term": "Laborwert", "plural": "die Laborwerte", "en": "lab value", "example": "Der Kaliumwert ist mit 6,1 deutlich erhöht."},
    {"article": "die", "term": "telefonische Anordnung", "plural": "die telefonischen Anordnungen", "en": "verbal (phone) order", "example": "Eine telefonische Anordnung muss der Arzt später gegenzeichnen."},
    {"article": "", "term": "wiederholen", "plural": "", "en": "to repeat (back)", "example": "Ich wiederhole: 40 Milligramm Furosemid intravenös, jetzt sofort."},
    {"article": "", "term": "gegenzeichnen", "plural": "", "en": "to countersign", "example": "Bitte zeichnen Sie die Anordnung bei der Visite gegen."},
    {"article": "", "term": "kaltschweißig", "plural": "", "en": "in a cold sweat", "example": "Der Patient ist blass und kaltschweißig."},
    {"article": "", "term": "somnolent", "plural": "", "en": "drowsy (but rousable)", "example": "Die Patientin ist seit einer Stunde somnolent."},
    {"article": "", "term": "i. v. (intravenös)", "plural": "", "en": "intravenous", "example": "Das Antibiotikum wird i. v. verabreicht."},
    {"article": "", "term": "s. c. (subkutan)", "plural": "", "en": "subcutaneous", "example": "Heparin wird s. c. in den Bauch gespritzt."}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000602', '10000000-0000-4000-8000-000000000006', 'reading',
 'Lesen: Das SBAR-Schema', 'Reading: the SBAR scheme', 2, true, $j${
  "intro_de": "SBAR hilft dir, am Telefon kurz und vollständig zu informieren.",
  "intro_en": "SBAR helps you give short and complete information on the phone.",
  "text": "Telefonieren nach SBAR\n\nGerade nachts müssen Pflegekräfte oft Ärztinnen und Ärzte anrufen, die den Patienten nicht kennen. Damit keine wichtige Information verloren geht, nutzen viele Kliniken das SBAR-Schema.\n\nS – Situation: Wer ruft an, von welcher Station, wegen welchem Patienten? Was ist das akute Problem? Beispiel: „Hier ist Pflegefachfrau Nguyen von der 5B. Ich rufe wegen Frau Roth an, Zimmer 3. Sie hat seit 30 Minuten starke Atemnot.“\n\nB – Background (Hintergrund): Welche Diagnose hat der Patient? Welche Vorerkrankungen, Medikamente oder Allergien sind wichtig? Beispiel: „Sie ist 84 Jahre alt, hat eine bekannte Herzinsuffizienz und wurde gestern wegen Wassereinlagerungen aufgenommen.“\n\nA – Assessment (Einschätzung): Welche Werte hast du gemessen? Was ist deine Einschätzung? Beispiel: „Die Sättigung liegt bei 86 Prozent, die Atemfrequenz bei 28, sie hat feuchte Rasselgeräusche. Ich glaube, sie entwickelt ein Lungenödem.“\n\nR – Recommendation (Empfehlung): Was brauchst du vom Arzt? Beispiel: „Bitte kommen Sie sofort. Soll ich bis dahin Sauerstoff geben?“\n\nWichtig: Bereite dich vor dem Anruf vor. Hab die Patientenkurve, die aktuellen Werte und die Medikamentenliste bereit. Wenn der Arzt etwas anordnet, wiederholst du die Anordnung laut (Read-back) und dokumentierst sie mit Uhrzeit, Name des Arztes und dem Vermerk „telefonische Anordnung“. Der Arzt muss sie später gegenzeichnen.",
  "questions": [
    {"type": "mc", "prompt": "Wofür steht das „B“ in SBAR?", "options": ["Befund", "Background – Hintergrund", "Blutdruck", "Behandlung"], "answer": 1},
    {"type": "mc", "prompt": "In welchen Teil gehört „Die Sättigung liegt bei 86 Prozent“?", "options": ["S – Situation", "B – Background", "A – Assessment", "R – Recommendation"], "answer": 2},
    {"type": "mc", "prompt": "Was solltest du VOR dem Anruf tun?", "options": ["Die Angehörigen informieren", "Patientenkurve, Werte und Medikamentenliste bereitlegen", "Die Stationsleitung fragen", "Nichts, einfach anrufen"], "answer": 1},
    {"type": "gap", "prompt": "Eine Anordnung am Telefon wiederholt man laut. Das nennt man ___.", "answer": "Read-back", "alternatives": ["Readback", "read back"]},
    {"type": "mc", "prompt": "Was muss der Arzt mit einer telefonischen Anordnung später tun?", "options": ["Sie löschen", "Sie gegenzeichnen", "Sie faxen", "Nichts"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000603', '10000000-0000-4000-8000-000000000006', 'listening',
 'Hören: Nachts beim Dienstarzt anrufen', 'Listening: calling the doctor on duty at night', 3, true, $j${
  "intro_de": "Pflegefachmann Daniel ruft nachts den Dienstarzt an. Achte auf die Werte und die Anordnungen.",
  "intro_en": "Nurse Daniel calls the doctor on duty at night. Pay attention to the values and orders.",
  "transcript": "Dr. Hartmann: Hartmann, Dienstarzt Innere.\nDaniel: Guten Abend, Herr Dr. Hartmann. Hier ist Daniel, Pflegefachmann von der Station 2C. Ich rufe wegen Frau Roth an, Zimmer 3. Sie hat seit etwa 30 Minuten zunehmende Atemnot.\nDr. Hartmann: Was hat sie für eine Diagnose?\nDaniel: Sie ist 84 Jahre alt und wurde gestern mit einer dekompensierten Herzinsuffizienz aufgenommen. Sie bekommt zweimal täglich 40 Milligramm Furosemid.\nDr. Hartmann: Welche Werte haben Sie?\nDaniel: Blutdruck 165 zu 95, Puls 112, unregelmäßig. Die Atemfrequenz liegt bei 28 pro Minute, die Sättigung bei 86 Prozent ohne Sauerstoff. Ich höre feuchte Rasselgeräusche, und sie ist sehr unruhig. Ich mache mir Sorgen, dass sie ein Lungenödem bekommt.\nDr. Hartmann: Gut, dass Sie anrufen. Bitte setzen Sie sie aufrecht hin und geben Sie 4 Liter Sauerstoff über die Nasenbrille. Geben Sie zusätzlich 40 Milligramm Furosemid intravenös. Ich komme in zehn Minuten.\nDaniel: Ich wiederhole: Oberkörper hoch, 4 Liter Sauerstoff über Nasenbrille und 40 Milligramm Furosemid intravenös, jetzt sofort. Sie kommen in zehn Minuten.\nDr. Hartmann: Richtig. Und bereiten Sie bitte eine Blutgasanalyse vor.\nDaniel: Mache ich. Bis gleich.",
  "max_plays": 2,
  "questions": [
    {"type": "mc", "prompt": "Warum ruft Daniel an?", "options": ["Die Patientin ist gestürzt.", "Die Patientin hat zunehmende Atemnot.", "Die Patientin hat Fieber.", "Die Patientin will nach Hause."], "answer": 1},
    {"type": "gap", "prompt": "Die Sauerstoffsättigung liegt ohne Sauerstoff bei ___ Prozent.", "answer": "86"},
    {"type": "mc", "prompt": "Was befürchtet Daniel?", "options": ["Einen Herzinfarkt", "Ein Lungenödem", "Eine Allergie", "Einen Schlaganfall"], "answer": 1},
    {"type": "mc", "prompt": "Wie viel Sauerstoff soll Daniel geben?", "options": ["2 Liter", "4 Liter", "6 Liter", "Keinen"], "answer": 1},
    {"type": "gap", "prompt": "Daniel soll 40 Milligramm ___ intravenös geben.", "answer": "Furosemid"},
    {"type": "mc", "prompt": "Was soll Daniel zusätzlich vorbereiten?", "options": ["Ein EKG", "Eine Blutgasanalyse", "Eine Infusion", "Ein Röntgenbild"], "answer": 1}
  ],
  "audio_path": "/audio/m6-dienstarzt.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000604', '10000000-0000-4000-8000-000000000006', 'dialogue',
 'Dialog: Laborwert am Telefon melden', 'Dialogue: reporting a lab value by phone', 4, true, $j${
  "intro_de": "Das Labor hat einen auffälligen Wert gemeldet. Pflegefachfrau Elif informiert die Stationsärztin.",
  "intro_en": "The lab has reported an abnormal value. Nurse Elif informs the ward doctor.",
  "lines": [
    {"speaker": "Elif", "text": "Frau Dr. Scholz, hier ist Elif von der 4A. Ich rufe wegen Herrn Becker an, Zimmer 6. Das Labor hat gerade einen Kaliumwert von 6,2 gemeldet."},
    {"speaker": "Dr. Scholz", "text": "6,2? Das ist hoch. Wie geht es ihm?"},
    {"speaker": "Elif", "text": "Er sagt, er fühlt sich schwach und hat ein Kribbeln in den Händen. Der Puls ist 52 und unregelmäßig, Blutdruck 110 zu 70."},
    {"speaker": "Dr. Scholz", "text": "Welche Medikamente bekommt er?"},
    {"speaker": "Elif", "text": "Unter anderem Ramipril und Spironolacton. Er hat außerdem eine bekannte Niereninsuffizienz."},
    {"speaker": "Dr. Scholz", "text": "Bitte setzen Sie das Spironolacton sofort ab, schließen Sie ihn an den Monitor an und schreiben Sie ein EKG. Ich komme gleich."},
    {"speaker": "Elif", "text": "Ich wiederhole: Spironolacton absetzen, Monitor anschließen, EKG schreiben. Sie kommen gleich."},
    {"speaker": "Dr. Scholz", "text": "Genau, danke."},
    {"speaker": "Elif", "text": "Ich dokumentiere das als telefonische Anordnung. Bitte zeichnen Sie sie nachher gegen."}
  ],
  "questions": [
    {"type": "gap", "prompt": "Der Kaliumwert von Herrn Becker liegt bei ___.", "answer": "6,2", "alternatives": ["6.2"]},
    {"type": "mc", "prompt": "Welche Beschwerden hat Herr Becker?", "options": ["Kopfschmerzen und Übelkeit", "Schwäche und Kribbeln in den Händen", "Atemnot und Husten", "Keine"], "answer": 1},
    {"type": "mc", "prompt": "Welches Medikament soll abgesetzt werden?", "options": ["Ramipril", "Spironolacton", "Insulin", "Metamizol"], "answer": 1},
    {"type": "mc", "prompt": "Warum wiederholt Elif die Anordnungen?", "options": ["Weil sie die Ärztin nicht verstanden hat", "Um Fehler zu vermeiden (Read-back)", "Weil die Verbindung schlecht ist", "Aus Höflichkeit"], "answer": 1}
  ],
  "audio_path": "/audio/m6-laborwert.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000605', '10000000-0000-4000-8000-000000000006', 'writing',
 'Schreiben: Telefonische Anordnung dokumentieren', 'Writing: documenting a phone order', 5, true, $j${
  "intro_de": "Nach dem Telefonat dokumentierst du Anlass, Werte und Anordnungen.",
  "intro_en": "After the call you document the reason, values and orders.",
  "task_de": "Dokumentiere das Telefonat zwischen Daniel und Dr. Hartmann (Lektion „Hören: Nachts beim Dienstarzt anrufen“) im Pflegebericht. Schreibe sachlich, mit Uhrzeit, Werten, Anordnungen und Maßnahmen.",
  "task_en": "Document the call between Daniel and Dr Hartmann (lesson \"Listening: calling the doctor on duty at night\") in the nursing report. Write objectively, with time, values, orders and measures.",
  "text": "Zusatzinformationen:\n- Anruf um 23:40 Uhr\n- Maßnahmen um 23:45 Uhr durchgeführt\n- Dr. Hartmann um 23:52 Uhr auf Station\n- 00:15 Uhr: SpO2 93 % mit 4 l O2, AF 22/min, Patientin ruhiger",
  "hints": ["Uhrzeit und Anlass des Anrufs", "Gemessene Werte", "Anordnungen mit Vermerk „telefonische Anordnung“", "Durchgeführte Maßnahmen und Verlauf"],
  "min_words": 80
}$j$::jsonb),

('20000000-0000-4000-8000-000000000606', '10000000-0000-4000-8000-000000000006', 'speaking',
 'Sprechen: Anruf nach SBAR', 'Speaking: phone call using SBAR', 6, true, $j${
  "intro_de": "Jetzt rufst du selbst an. Stell dir vor, die Ärztin ist am Telefon.",
  "intro_en": "Now you make the call yourself. Imagine the doctor is on the phone.",
  "task_de": "Ruf die Dienstärztin an und informiere sie nach dem SBAR-Schema über Herrn Yıldız. Schließe mit einer klaren Bitte (Recommendation).",
  "task_en": "Call the doctor on duty and inform her about Mr Yıldız using SBAR. End with a clear request (recommendation).",
  "text": "Herr Mehmet Yıldız, 63 J., Zimmer 11, Station 1B\nTag 2 nach Darm-OP\nSeit 1 Stunde starke Bauchschmerzen NRS 8, Bauch hart\nRR 98/60 mmHg, Puls 124/min, Temp. 38,7 °C\nVerband: leicht blutig\nBedarfsmedikation Metamizol 1 g um 21 Uhr: ohne Wirkung\nAllergie: Penicillin",
  "hints": ["S: Wer bist du, wer ist der Patient, was ist das Problem?", "B: OP, Allergie, bisherige Medikamente", "A: Werte und deine Einschätzung", "R: Bitte kommen Sie … / Soll ich …?"],
  "max_seconds": 150
}$j$::jsonb),

-- Modul 7: Gespräche mit Angehörigen ---------------------------------------------
('20000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000007', 'vocabulary',
 'Wortschatz: Angehörige', 'Vocabulary: relatives', 1, true, $j${
  "intro_de": "Wörter und Wendungen für Gespräche mit Angehörigen.",
  "intro_en": "Words and phrases for conversations with relatives.",
  "items": [
    {"article": "die", "term": "Schweigepflicht", "plural": "", "en": "duty of confidentiality", "example": "Wegen der Schweigepflicht darf ich am Telefon keine Auskunft geben."},
    {"article": "die", "term": "Vorsorgevollmacht", "plural": "die Vorsorgevollmachten", "en": "lasting power of attorney", "example": "Die Tochter hat eine Vorsorgevollmacht für Gesundheitsfragen."},
    {"article": "der", "term": "Betreuer", "plural": "die Betreuer", "en": "legal guardian", "example": "Der gesetzliche Betreuer entscheidet über die Behandlung mit."},
    {"article": "die", "term": "Besuchszeit", "plural": "die Besuchszeiten", "en": "visiting hours", "example": "Die Besuchszeit ist täglich von 14 bis 19 Uhr."},
    {"article": "die", "term": "Beschwerde", "plural": "die Beschwerden", "en": "complaint", "example": "Der Sohn hat eine Beschwerde über das Essen."},
    {"article": "das", "term": "Verständnis", "plural": "", "en": "understanding", "example": "Ich habe Verständnis für Ihre Sorge."},
    {"article": "die", "term": "Kurzzeitpflege", "plural": "", "en": "short-term care", "example": "Nach der Entlassung geht Ihre Mutter erst in die Kurzzeitpflege."},
    {"article": "der", "term": "Sozialdienst", "plural": "die Sozialdienste", "en": "social services (hospital)", "example": "Der Sozialdienst hilft bei der Organisation der Reha."},
    {"article": "", "term": "beruhigen", "plural": "", "en": "to reassure / calm down", "example": "Ich kann Sie beruhigen: Ihr Vater hat gut geschlafen."},
    {"article": "", "term": "sich wenden an", "plural": "", "en": "to turn to / contact", "example": "Mit medizinischen Fragen wenden Sie sich bitte an die Ärztin."},
    {"article": "", "term": "einbeziehen", "plural": "", "en": "to involve", "example": "Wir möchten Sie gern in die Pflege einbeziehen."},
    {"article": "", "term": "palliativ", "plural": "", "en": "palliative", "example": "Die Behandlung ist jetzt palliativ, es geht um Lebensqualität."}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000007', 'listening',
 'Hören: Eine Tochter macht sich Sorgen', 'Listening: a worried daughter', 2, true, $j${
  "intro_de": "Frau Neumann besucht ihren Vater und spricht mit Pflegefachfrau Olena.",
  "intro_en": "Ms Neumann visits her father and talks to nurse Olena.",
  "transcript": "Frau Neumann: Entschuldigung, sind Sie für meinen Vater zuständig? Herr Neumann, Zimmer 14.\nOlena: Ja, ich bin Olena, ich betreue Ihren Vater heute. Wie kann ich Ihnen helfen?\nFrau Neumann: Ich mache mir große Sorgen. Er ist so verwirrt, er hat mich vorhin gar nicht erkannt. Zu Hause war er nie so.\nOlena: Ich verstehe, dass Sie das erschreckt. Viele ältere Menschen sind nach einer Operation einige Tage verwirrt. Das nennt man Delir. Es geht meistens wieder vorbei.\nFrau Neumann: Und was machen Sie dagegen?\nOlena: Wir sorgen für einen festen Tagesrhythmus, viel Licht am Tag und Ruhe in der Nacht. Es hilft auch, wenn er seine Brille und sein Hörgerät trägt. Und vertraute Menschen helfen sehr. Können Sie vielleicht morgen ein Foto von der Familie mitbringen?\nFrau Neumann: Ja, natürlich. Hat er denn heute etwas gegessen?\nOlena: Zum Frühstück hat er eine halbe Scheibe Brot gegessen, mittags fast nichts. Wenn Sie möchten, können Sie ihm beim Abendessen helfen. Bei Ihnen isst er vielleicht mehr.\nFrau Neumann: Das mache ich gern. Kann ich auch mit dem Arzt sprechen?\nOlena: Dr. Hoffmann ist ab 17 Uhr wieder auf Station. Ich sage ihm Bescheid, dass Sie ihn sprechen möchten.",
  "max_plays": 2,
  "questions": [
    {"type": "mc", "prompt": "Warum macht sich Frau Neumann Sorgen?", "options": ["Ihr Vater hat Schmerzen.", "Ihr Vater ist verwirrt und hat sie nicht erkannt.", "Ihr Vater ist gestürzt.", "Ihr Vater will nach Hause."], "answer": 1},
    {"type": "gap", "prompt": "Eine Verwirrtheit nach einer Operation nennt man ___.", "answer": "Delir", "alternatives": ["ein Delir", "Delirium"]},
    {"type": "mc", "prompt": "Was soll Frau Neumann morgen mitbringen?", "options": ["Kleidung", "Ein Foto von der Familie", "Seine Medikamente", "Essen von zu Hause"], "answer": 1},
    {"type": "mc", "prompt": "Was hat Herr Neumann zu Mittag gegessen?", "options": ["Eine halbe Scheibe Brot", "Fast nichts", "Alles", "Eine Suppe"], "answer": 1},
    {"type": "gap", "prompt": "Der Arzt ist ab ___ Uhr wieder auf Station.", "answer": "17"}
  ],
  "audio_path": "/audio/m7-tochter.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000703', '10000000-0000-4000-8000-000000000007', 'dialogue',
 'Dialog: Auskunft am Telefon und Schweigepflicht', 'Dialogue: information by phone and confidentiality', 3, true, $j${
  "intro_de": "Ein Anrufer möchte Informationen über eine Patientin. Wie reagiert die Pflegekraft richtig?",
  "intro_en": "A caller wants information about a patient. How does the nurse react correctly?",
  "lines": [
    {"speaker": "Herr Kaya", "text": "Guten Tag, hier ist Kaya. Ich möchte wissen, wie es Frau Kaya geht. Sie liegt seit gestern bei Ihnen."},
    {"speaker": "Pflegekraft", "text": "Guten Tag, Herr Kaya. In welcher Beziehung stehen Sie zu Frau Kaya?"},
    {"speaker": "Herr Kaya", "text": "Ich bin ihr Neffe. Was hat sie denn genau? Ist es etwas Schlimmes?"},
    {"speaker": "Pflegekraft", "text": "Ich verstehe, dass Sie sich Sorgen machen. Leider darf ich am Telefon wegen der Schweigepflicht keine Auskunft über Diagnosen geben."},
    {"speaker": "Herr Kaya", "text": "Aber ich bin doch Familie!"},
    {"speaker": "Pflegekraft", "text": "Das glaube ich Ihnen. Ich kann am Telefon aber nicht überprüfen, wer Sie sind. Frau Kaya hat ihre Tochter als Ansprechpartnerin angegeben. Am besten sprechen Sie mit ihr."},
    {"speaker": "Herr Kaya", "text": "Kann ich meine Tante denn besuchen?"},
    {"speaker": "Pflegekraft", "text": "Ja, gern. Die Besuchszeit ist von 14 bis 19 Uhr. Dann können Sie auch direkt mit ihr sprechen. Ich richte ihr aus, dass Sie angerufen haben."},
    {"speaker": "Herr Kaya", "text": "Gut, vielen Dank."}
  ],
  "questions": [
    {"type": "mc", "prompt": "Warum gibt die Pflegekraft keine Auskunft über die Diagnose?", "options": ["Weil sie die Diagnose nicht kennt", "Wegen der Schweigepflicht", "Weil sie keine Zeit hat", "Weil der Arzt es verboten hat"], "answer": 1},
    {"type": "mc", "prompt": "Wen hat Frau Kaya als Ansprechpartnerin angegeben?", "options": ["Ihren Neffen", "Ihren Mann", "Ihre Tochter", "Niemanden"], "answer": 2},
    {"type": "mc", "prompt": "Was bietet die Pflegekraft an?", "options": ["Einen Rückruf des Chefarztes", "Einen Besuch in der Besuchszeit", "Eine E-Mail mit dem Befund", "Nichts"], "answer": 1},
    {"type": "gap", "prompt": "„Ich verstehe, dass Sie sich ___ machen.“", "answer": "Sorgen"}
  ],
  "audio_path": "/audio/m7-schweigepflicht.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000704', '10000000-0000-4000-8000-000000000007', 'quiz',
 'Quiz: Einfühlsam reagieren', 'Quiz: responding empathetically', 4, true, $j${
  "intro_de": "Welche Reaktion ist professionell und einfühlsam?",
  "intro_en": "Which response is professional and empathetic?",
  "questions": [
    {"type": "mc", "prompt": "Ein Sohn sagt wütend: „Meine Mutter liegt schon wieder im nassen Bett!“", "options": ["„Das stimmt nicht.“", "„Wir haben eben viel zu tun.“", "„Das tut mir leid. Ich schaue sofort nach und kümmere mich darum.“", "„Beschweren Sie sich bei der Leitung.“"], "answer": 2},
    {"type": "mc", "prompt": "Eine Ehefrau fragt: „Wird mein Mann wieder gesund?“", "options": ["„Ja, ganz bestimmt.“", "„Nein, das wird nichts mehr.“", "„Ich verstehe Ihre Frage. Dazu kann Ihnen die Ärztin am besten Auskunft geben. Soll ich ein Gespräch vereinbaren?“", "„Keine Ahnung.“"], "answer": 2},
    {"type": "gap", "prompt": "„Ich habe ___ für Ihren Ärger.“ (Nomen)", "answer": "Verständnis"},
    {"type": "mc", "prompt": "Was ist beim aktiven Zuhören wichtig?", "options": ["Schnell eine Lösung nennen", "Den Angehörigen unterbrechen", "Gefühle wahrnehmen und das Gesagte zusammenfassen", "Auf die Uhr schauen"], "answer": 2},
    {"type": "mc", "prompt": "Wer hilft bei der Organisation von Reha oder Pflegeheim?", "options": ["Der Sozialdienst", "Die Küche", "Der Hausmeister", "Das Labor"], "answer": 0},
    {"type": "gap", "prompt": "„Mit medizinischen Fragen ___ Sie sich bitte an Dr. Hoffmann.“ (sich wenden)", "answer": "wenden"}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000705', '10000000-0000-4000-8000-000000000007', 'writing',
 'Schreiben: Antwort auf eine Beschwerde', 'Writing: replying to a complaint', 5, true, $j${
  "intro_de": "In der Prüfung kann eine Beschwerde von Angehörigen vorkommen, auf die du schriftlich antwortest.",
  "intro_en": "In the exam you may have to reply in writing to a complaint from relatives.",
  "task_de": "Herr Schulte hat sich per E-Mail über die Pflege seiner Mutter beschwert. Antworte ihm im Namen der Station: Bedanke dich für die Rückmeldung, zeige Verständnis, erkläre die Situation und nenne konkrete Lösungen. Schlage ein Gespräch vor.",
  "task_en": "Mr Schulte has complained by email about his mother's care. Reply on behalf of the ward: thank him for the feedback, show understanding, explain the situation, name concrete solutions and suggest a meeting.",
  "text": "E-Mail von Herrn Schulte:\n\nSehr geehrte Damen und Herren,\nmeine Mutter, Erika Schulte, liegt seit einer Woche auf Ihrer Station (Zimmer 9). Gestern habe ich sie um 15 Uhr besucht. Das Mittagessen stand noch unberührt auf dem Tisch, weil sie nicht allein essen kann. Außerdem hat sie zweimal geklingelt, aber es kam lange niemand. Ich bin sehr enttäuscht. Meine Mutter braucht Hilfe!\nMit freundlichen Grüßen\nMarkus Schulte",
  "hints": ["Anrede und Dank für die Nachricht", "Verständnis zeigen und Bedauern ausdrücken", "Maßnahmen: Hilfe beim Essen, Trinkprotokoll, Klingel …", "Gesprächsangebot mit Terminvorschlag, Grußformel"],
  "min_words": 120
}$j$::jsonb),

('20000000-0000-4000-8000-000000000706', '10000000-0000-4000-8000-000000000007', 'speaking',
 'Sprechen: Entlassung mit Angehörigen besprechen', 'Speaking: discussing discharge with relatives', 6, true, $j${
  "intro_de": "Im Prüfungsteil Sprechen führst du oft ein Gespräch mit Patienten oder Angehörigen.",
  "intro_en": "In the speaking exam you often have a conversation with patients or relatives.",
  "task_de": "Herr Neumann (82 J.) wird übermorgen entlassen. Seine Tochter ist unsicher, ob sie ihn zu Hause versorgen kann. Erkläre ihr, was nach der Entlassung wichtig ist, und mache konkrete Vorschläge zur Unterstützung.",
  "task_en": "Mr Neumann (82) will be discharged the day after tomorrow. His daughter is unsure whether she can care for him at home. Explain what is important after discharge and make concrete suggestions for support.",
  "text": "Informationen:\n- Herr Neumann läuft mit Rollator, braucht Hilfe beim Duschen\n- neue Medikamente: Blutverdünner morgens\n- Termin beim Hausarzt in 5 Tagen\n- Möglichkeiten: ambulanter Pflegedienst, Kurzzeitpflege, Pflegegrad beantragen, Sozialdienst berät heute um 14 Uhr",
  "hints": ["Begrüßung und Verständnis für die Unsicherheit", "Was braucht Herr Neumann im Alltag?", "Medikamente und Arzttermin", "Unterstützungsmöglichkeiten und nächste Schritte"],
  "max_seconds": 180
}$j$::jsonb),

-- Modul 8: Pflegebericht schreiben --------------------------------------------------
('20000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000008', 'reading',
 'Lesen: So ist ein Pflegebericht aufgebaut', 'Reading: how a nursing report is structured', 1, true, $j${
  "intro_de": "Ein guter Pflegebericht ist kurz, sachlich und vollständig. Lies die Hinweise und den Beispielbericht.",
  "intro_en": "A good nursing report is short, objective and complete. Read the tips and the example report.",
  "text": "Der Pflegebericht beschreibt den Verlauf während einer Schicht. Er ergänzt die Kurve und die Pflegeplanung. Er enthält vor allem Veränderungen, Besonderheiten und die Wirkung von Maßnahmen.\n\nRegeln:\n1. Datum, Uhrzeit und Handzeichen bei jedem Eintrag.\n2. Beobachtungen beschreiben, nicht bewerten („Pat. weint und sagt, sie hat Angst vor der OP“ statt „Pat. ist hysterisch“).\n3. Messbare Angaben machen: Werte, Mengen, Zeiten, Skalen.\n4. Maßnahmen und ihre Wirkung nennen („Nach Lagerung Schmerzen von 6 auf 3 reduziert“).\n5. Meist im Präteritum oder Perfekt schreiben; Stichworte sind erlaubt, solange sie eindeutig sind.\n6. Nur übliche Abkürzungen verwenden.\n\nBeispiel – Spätdienst, 19.11.\n14:30 Uhr: Pat. klagte über Übelkeit, hat einmal erbrochen (ca. 150 ml, gelblich). RR 128/76 mmHg, P 88/min. Dienstarzt informiert, MCP 10 mg i. v. nach Anordnung verabreicht. – SK\n15:15 Uhr: Übelkeit laut Pat. deutlich besser, kein erneutes Erbrechen. Trinkt kleine Schlucke Tee. – SK\n18:00 Uhr: Abendessen: halbe Portion Suppe gegessen. Mit Rollator auf dem Flur mobilisiert (ca. 20 m), sicher. – SK\n20:30 Uhr: Pat. äußert Angst vor der Untersuchung morgen. Gespräch geführt, Ablauf erklärt; Pat. wirkte danach ruhiger und sagte, sie sei erleichtert. – SK",
  "questions": [
    {"type": "mc", "prompt": "Was gehört vor allem in den Pflegebericht?", "options": ["Alles, was jeden Tag gleich ist", "Veränderungen, Besonderheiten und die Wirkung von Maßnahmen", "Die Meinung der Pflegekraft", "Nur die Vitalzeichen"], "answer": 1},
    {"type": "mc", "prompt": "Welche Formulierung entspricht den Regeln?", "options": ["„Pat. ist hysterisch.“", "„Pat. weint und sagt, sie hat Angst vor der OP.“", "„Pat. stellt sich an.“", "„Pat. nervös, wie immer.“"], "answer": 1},
    {"type": "gap", "prompt": "Gegen die Übelkeit wurden 10 mg ___ i. v. verabreicht.", "answer": "MCP", "alternatives": ["Metoclopramid"]},
    {"type": "mc", "prompt": "Welche Zeitformen nutzt man meistens?", "options": ["Futur", "Präteritum oder Perfekt", "Konjunktiv II", "Nur Präsens"], "answer": 1},
    {"type": "mc", "prompt": "Wie weit ist die Patientin um 18 Uhr gegangen?", "options": ["Ca. 5 m", "Ca. 20 m", "Ca. 100 m", "Gar nicht"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000008', 'quiz',
 'Quiz: Formulierungen im Pflegebericht', 'Quiz: phrases in the nursing report', 2, true, $j${
  "intro_de": "Ergänze die typischen Verben und Formen für den Pflegebericht.",
  "intro_en": "Complete the typical verbs and forms for the nursing report.",
  "questions": [
    {"type": "gap", "prompt": "Pat. ___ über starke Kopfschmerzen. (klagen, Präteritum)", "answer": "klagte"},
    {"type": "gap", "prompt": "Um 10 Uhr wurde Paracetamol 1 g p. o. ___. (verabreichen, Partizip II)", "answer": "verabreicht"},
    {"type": "gap", "prompt": "Pat. ___ das Frühstück ab. (ablehnen, Präteritum)", "answer": "lehnte"},
    {"type": "gap", "prompt": "Pat. wurde mit Unterstützung an die Bettkante ___. (mobilisieren, Partizip II)", "answer": "mobilisiert"},
    {"type": "mc", "prompt": "Was bedeutet „p. o.“?", "options": ["Über den Mund (per os)", "Nach der Operation", "In die Vene", "Pro Ohr"], "answer": 0},
    {"type": "mc", "prompt": "Welcher Satz beschreibt die Wirkung einer Maßnahme?", "options": ["„Kühlakku aufgelegt.“", "„Nach dem Kühlen gibt Pat. Schmerzen NRS 2 statt 5 an.“", "„Pat. hat Schmerzen.“", "„Kühlung empfohlen.“"], "answer": 1},
    {"type": "gap", "prompt": "Die Ärztin wurde um 15 Uhr über den Blutdruck ___. (informieren, Partizip II)", "answer": "informiert"},
    {"type": "mc", "prompt": "Welche Abkürzung steht für „Patient/Patientin“?", "options": ["Ptn.", "Pat.", "Pa.", "Pt"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000008', 'listening',
 'Hören: Notizen für den Bericht', 'Listening: notes for the report', 3, true, $j${
  "intro_de": "Pflegefachmann Jonas erzählt seiner Kollegin, was im Spätdienst bei Frau Krüger passiert ist. Diese Informationen brauchst du in der nächsten Lektion für deinen Pflegebericht.",
  "intro_en": "Nurse Jonas tells his colleague what happened with Mrs Krüger during the late shift. You will need this information in the next lesson for your nursing report.",
  "transcript": "Jonas: Bei Frau Krüger war heute im Spätdienst einiges los. Um 15 Uhr hat sie geklingelt, weil sie Schmerzen in der Wunde am Bauch hatte. Sie hat eine 7 auf der Schmerzskala angegeben. Ich habe ihr nach Plan 7,5 Milligramm Piritramid unter die Haut gespritzt. Eine halbe Stunde später waren die Schmerzen bei 3.\nKollegin: Wie sah die Wunde aus?\nJonas: Der Verband war trocken, die Wunde reizlos. Um 17 Uhr habe ich sie dann zum ersten Mal mobilisiert. Mit meiner Hilfe ist sie bis zur Tür und zurück gelaufen. Am Anfang war ihr kurz schwindelig, der Blutdruck lag bei 105 zu 65. Nach zwei Minuten im Sitzen ging es wieder.\nKollegin: Hat sie gegessen?\nJonas: Zum Abendessen nur eine halbe Scheibe Zwieback und Tee. Insgesamt hat sie im Spätdienst 700 Milliliter getrunken. Und um 19 Uhr hat ihr Mann angerufen. Sie hat mit ihm gesprochen und war danach sehr gut gelaunt.",
  "max_plays": 2,
  "questions": [
    {"type": "gap", "prompt": "Um 15 Uhr gab Frau Krüger Schmerzen von ___ auf der Skala an.", "answer": "7", "alternatives": ["sieben"]},
    {"type": "mc", "prompt": "Wie wurde das Schmerzmittel verabreicht?", "options": ["Als Tablette", "Unter die Haut (s. c.)", "In die Vene", "Als Zäpfchen"], "answer": 1},
    {"type": "mc", "prompt": "Was passierte bei der Mobilisation?", "options": ["Sie ist gestürzt.", "Ihr war kurz schwindelig.", "Sie hatte Atemnot.", "Nichts Besonderes."], "answer": 1},
    {"type": "gap", "prompt": "Im Spätdienst hat Frau Krüger ___ Milliliter getrunken.", "answer": "700"},
    {"type": "mc", "prompt": "Welche Formulierung von Jonas solltest du im Bericht NICHT übernehmen?", "options": ["„Verband trocken, Wunde reizlos“", "„RR 105/65 mmHg“", "„war danach sehr gut gelaunt“", "„Schmerzen NRS 3“"], "answer": 2, "explanation": "Besser sachlich: „Pat. telefonierte mit ihrem Ehemann und lachte dabei.“"}
  ],
  "audio_path": "/audio/m8-notizen.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000008', 'writing',
 'Schreiben: Pflegebericht Spätdienst', 'Writing: late shift nursing report', 4, true, $j${
  "intro_de": "Jetzt schreibst du selbst einen Pflegebericht – wie im Prüfungsteil Schreiben.",
  "intro_en": "Now you write a nursing report yourself – as in the writing part of the exam.",
  "task_de": "Schreibe den Pflegebericht für Frau Krüger (Spätdienst, 20.11.) mit den Informationen aus der Lektion „Hören: Notizen für den Bericht“. Schreibe mit Uhrzeiten, sachlich und vollständig.",
  "task_en": "Write the nursing report for Mrs Krüger (late shift, 20 Nov) using the information from the lesson \"Listening: notes for the report\". Include times, write objectively and completely.",
  "text": "Frau Helga Krüger, 66 J., Tag 1 nach Gallenblasen-OP (laparoskopisch), Zimmer 5",
  "hints": ["15:00 Schmerzen, Maßnahme und Wirkung", "Wunde und Verband", "17:00 Mobilisation mit Kreislaufreaktion", "Ernährung und Trinkmenge", "19:00 Telefonat – sachlich beschreiben"],
  "min_words": 100
}$j$::jsonb),

('20000000-0000-4000-8000-000000000805', '10000000-0000-4000-8000-000000000008', 'quiz',
 'Quiz: Fehler im Pflegebericht finden', 'Quiz: finding mistakes in the nursing report', 5, true, $j${
  "intro_de": "Jeder Satz hat ein Problem. Was ist falsch?",
  "intro_en": "Each sentence has a problem. What is wrong?",
  "questions": [
    {"type": "mc", "prompt": "„Pat. hat viel getrunken.“", "options": ["Die Zeitform ist falsch.", "Die Angabe ist nicht messbar – besser eine Menge in ml.", "Die Abkürzung ist falsch.", "Nichts, der Satz ist gut."], "answer": 1},
    {"type": "mc", "prompt": "„Pat. war heute total unkooperativ.“", "options": ["Das ist eine Bewertung – besser beschreiben, was der Patient getan oder gesagt hat.", "Es fehlt die Uhrzeit, sonst ist alles gut.", "„Pat.“ darf man nicht abkürzen.", "Nichts."], "answer": 0},
    {"type": "mc", "prompt": "„Schmerzmittel gegeben.“", "options": ["Es fehlen Name, Dosis, Art der Gabe, Uhrzeit und Wirkung.", "Das ist zu lang.", "Das gehört nicht in den Bericht.", "Nichts."], "answer": 0},
    {"type": "mc", "prompt": "„Morgen wird Pat. wahrscheinlich entlassen, glaube ich.“", "options": ["Vermutungen gehören nicht in den Bericht – nur gesicherte Informationen (z. B. „Entlassung für 21.11. geplant laut Dr. X“).", "Die Grammatik ist falsch.", "Es fehlt die Zimmernummer.", "Nichts."], "answer": 0},
    {"type": "gap", "prompt": "Richtig ist: „Pat. ___ (gehen, Perfekt: ist …) mit Rollator 30 m auf dem Flur.“", "answer": "ist gegangen", "alternatives": ["gegangen"]}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000806', '10000000-0000-4000-8000-000000000008', 'writing',
 'Schreiben: Pflegeüberleitungsbericht', 'Writing: care transfer report', 6, true, $j${
  "intro_de": "Wenn ein Patient in ein Pflegeheim oder zum ambulanten Dienst wechselt, schreibst du einen Überleitungsbericht.",
  "intro_en": "When a patient moves to a care home or home care service, you write a transfer report.",
  "task_de": "Herr Otto Fischer wird morgen in das Pflegeheim „Haus am See“ entlassen. Schreibe einen kurzen Überleitungsbericht an die Kolleginnen und Kollegen im Heim. Nutze die Stichpunkte und formuliere vollständige Sätze.",
  "task_en": "Mr Otto Fischer will be discharged to the care home \"Haus am See\" tomorrow. Write a short transfer report to the colleagues there. Use the notes and write complete sentences.",
  "text": "Stichpunkte:\n- 86 J., Aufnahme vor 10 Tagen wegen Lungenentzündung, jetzt ausgeheilt\n- Nebendiagnosen: Demenz (mittelgradig), Diabetes Typ 2\n- Medikamente: siehe Medikamentenplan; Insulin 8 IE s. c. morgens\n- Mobilität: läuft mit Rollator und Begleitung, Sturzgefahr\n- Ernährung: isst selbstständig, muss zum Trinken erinnert werden (Ziel 1,5 l)\n- Haut: intakt, Gesäß leicht gerötet – 3-stündlich lagern nachts\n- Orientierung: zeitlich und örtlich nicht orientiert, nachts oft unruhig\n- Kontakt: Tochter Petra Fischer (Vorsorgevollmacht), Tel. auf dem Stammblatt",
  "hints": ["Anrede und Anlass", "Diagnosen und Verlauf", "Pflegerische Schwerpunkte: Mobilität, Ernährung, Haut, Orientierung", "Ansprechpartnerin und Grußformel"],
  "min_words": 120
}$j$::jsonb)

on conflict (id) do update set module_id = excluded.module_id, kind = excluded.kind, title_de = excluded.title_de,
  title_en = excluded.title_en, sort = excluded.sort, published = excluded.published, content = excluded.content;
