-- Probeprüfung 1 (Fachsprache Pflege B2) für die Prüfungssimulation.
-- Voraussetzung: Migration 20261120220000_fsp_exams.sql ist eingespielt.
-- Die Prüfungsteile sind Lektionen eines eigenen, unveröffentlichten Moduls; sichtbar werden sie über die
-- veröffentlichte Prüfung. Kann mehrfach ausgeführt werden.

insert into fsp.modules (id, slug, title_de, title_en, description_de, description_en, sort, published) values
('10000000-0000-4000-8000-000000000901', 'probepruefung-1', 'Probeprüfung 1 – Prüfungsteile', 'Mock exam 1 – parts',
 'Aufgaben der Probeprüfung 1. Bearbeitung über „Probeprüfungen“.', '', 900, false)
on conflict (id) do update set title_de = excluded.title_de, description_de = excluded.description_de, published = false;

insert into fsp.exams (id, module_id, slug, title_de, title_en, description_de, description_en, pass_percent, sort, published) values
('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000901', 'probepruefung-1',
 'Probeprüfung 1: Fachsprache Pflege B2', 'Mock exam 1: German for nursing B2',
 'Ein kompletter Probedurchlauf mit allen Prüfungsteilen: Lesen, Sprachbausteine, Hören, Schreiben und Sprechen. Jeder Teil hat ein Zeitlimit wie in der echten Prüfung. Plane etwa 2 Stunden und 20 Minuten ein.',
 'A complete practice run with all parts: reading, language elements, listening, writing and speaking. Each part has a time limit as in the real exam. Allow about 2 hours and 20 minutes.',
 60, 1, true)
on conflict (id) do update set title_de = excluded.title_de, title_en = excluded.title_en, description_de = excluded.description_de,
  description_en = excluded.description_en, pass_percent = excluded.pass_percent, sort = excluded.sort, published = excluded.published;

insert into fsp.lessons (id, module_id, kind, title_de, title_en, sort, published, content) values

('20000000-0000-4000-8000-000000009001', '10000000-0000-4000-8000-000000000901', 'reading',
 'Lesen Teil 1: Mitteilungen auf Station', 'Reading part 1: notices on the ward', 1, true, $j${
  "intro_de": "Lies die fünf Mitteilungen. Welche Aussage passt zu welchem Text? Wähle jeweils die richtige Antwort.",
  "intro_en": "Read the five notices. Which statement matches which text? Choose the correct answer each time.",
  "text": "Text 1 – Aushang im Stationszimmer\nAb dem 1. Dezember wird die Übergabe vom Früh- an den Spätdienst am Patientenbett durchgeführt. Bitte planen Sie dafür 30 Minuten ein. Patienten, die schlafen oder dies nicht wünschen, werden im Stationszimmer übergeben.\n\nText 2 – E-Mail der Hygienefachkraft\nIn den letzten Wochen wurde auf zwei Stationen ein Norovirus nachgewiesen. Bei Erbrechen oder Durchfall sind betroffene Patienten sofort zu isolieren. Für die Händedesinfektion ist ein viruzides Mittel zu verwenden. Schutzkittel und Handschuhe liegen vor jedem Isolationszimmer bereit.\n\nText 3 – Notiz der Stationsleitung\nDie Fortbildung „Expertenstandard Schmerzmanagement“ am Donnerstag fällt aus, weil die Referentin erkrankt ist. Ein neuer Termin wird im Januar bekannt gegeben. Die Teilnahme bleibt für alle Pflegefachkräfte verpflichtend.\n\nText 4 – Information der Apotheke\nDas Medikament Pantoprazol 40 mg ist zurzeit nicht lieferbar. Als Ersatz wird Omeprazol 40 mg geliefert. Bitte informieren Sie die Patienten, dass die Tabletten anders aussehen. Die Dosierung ändert sich nicht.\n\nText 5 – Nachricht des Betriebsrats\nWer im Dezember zusätzliche Nachtdienste übernimmt, erhält pro Dienst einen Zuschlag von 50 Euro. Bitte tragen Sie sich bis zum 25. November in die Liste im Stationszimmer ein.",
  "time_minutes": 20,
  "questions": [
    {"type": "mc", "prompt": "Welcher Text informiert über eine Änderung beim Ablauf der Übergabe?", "options": ["Text 1", "Text 2", "Text 3", "Text 5"], "answer": 0},
    {"type": "mc", "prompt": "Text 2: Was soll man bei Patienten mit Erbrechen oder Durchfall tun?", "options": ["Sie sofort entlassen", "Sie sofort isolieren", "Sie auf eine andere Station verlegen", "Nichts Besonderes"], "answer": 1},
    {"type": "mc", "prompt": "Text 3: Was gilt für die Fortbildung?", "options": ["Sie findet am Donnerstag statt.", "Sie ist freiwillig.", "Sie wird verschoben und bleibt Pflicht.", "Sie wird online angeboten."], "answer": 2},
    {"type": "mc", "prompt": "Text 4: Was sollen Pflegekräfte den Patienten erklären?", "options": ["Dass die Dosis halbiert wird", "Dass die Tabletten anders aussehen", "Dass sie kein Medikament mehr bekommen", "Dass sie die Tabletten selbst kaufen müssen"], "answer": 1},
    {"type": "mc", "prompt": "Text 5: Bis wann muss man sich für zusätzliche Nachtdienste eintragen?", "options": ["Bis 1. Dezember", "Bis 25. November", "Bis Ende Dezember", "Bis Donnerstag"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000009002', '10000000-0000-4000-8000-000000000901', 'reading',
 'Lesen Teil 2: Fachartikel Dekubitusprophylaxe', 'Reading part 2: article on pressure ulcer prevention', 2, true, $j${
  "intro_de": "Lies den Artikel aus einer Fachzeitschrift und beantworte die Fragen.",
  "intro_en": "Read the article from a professional journal and answer the questions.",
  "text": "Druckgeschwüre vermeiden – mehr als nur Umlagern\n\nEin Dekubitus entsteht, wenn Haut und Gewebe über längere Zeit zu stark belastet werden. Besonders gefährdet sind Stellen, an denen Knochen dicht unter der Haut liegen, zum Beispiel das Kreuzbein, die Fersen und die Hüften. Schon nach wenigen Stunden ohne Entlastung kann das Gewebe dauerhaft geschädigt werden.\n\nLange galt die Regel, bettlägerige Patienten starr alle zwei Stunden umzulagern. Der aktuelle Expertenstandard empfiehlt dagegen, die Bewegungsintervalle individuell festzulegen. Entscheidend ist, wie sich die Haut des Patienten verhält: Bleibt eine Rötung nach dem Umlagern bestehen und lässt sie sich mit dem Finger nicht wegdrücken, ist das Intervall zu lang. Zusätzlich sollen Pflegekräfte die eigene Bewegung der Patienten so weit wie möglich fördern, denn kleine Positionswechsel, die der Patient selbst durchführt, entlasten die Haut besonders wirksam.\n\nWichtig ist auch die Einschätzung des Risikos. Sie erfolgt bei der Aufnahme und immer dann, wenn sich der Zustand des Patienten verändert. Neben der Beweglichkeit spielen Ernährung, Feuchtigkeit der Haut, zum Beispiel durch Inkontinenz, und die Durchblutung eine Rolle. Eine einmalige Einschätzung reicht nicht aus.\n\nHilfsmittel wie Wechseldruckmatratzen können sinnvoll sein, ersetzen aber nicht die Bewegungsförderung. Studien zeigen außerdem, dass das früher übliche „Eisen und Föhnen“ – also das abwechselnde Kühlen und Wärmen der Haut – schadet und nicht mehr angewendet werden soll. Auch Massagen gefährdeter Hautstellen werden heute nicht mehr empfohlen.\n\nNicht zuletzt kommt es auf die Dokumentation und die Zusammenarbeit an: Wenn alle Berufsgruppen – Pflege, Ärzte, Physiotherapie und Ernährungsberatung – ihre Beobachtungen austauschen, lassen sich viele Druckgeschwüre verhindern.",
  "time_minutes": 25,
  "questions": [
    {"type": "mc", "prompt": "Wo entsteht ein Dekubitus besonders häufig?", "options": ["An Stellen mit viel Muskulatur", "Wo Knochen dicht unter der Haut liegen", "Nur am Rücken", "An den Händen"], "answer": 1},
    {"type": "mc", "prompt": "Was empfiehlt der aktuelle Expertenstandard zur Umlagerung?", "options": ["Immer genau alle zwei Stunden umlagern", "Gar nicht mehr umlagern", "Die Intervalle individuell festlegen", "Nur nachts umlagern"], "answer": 2},
    {"type": "mc", "prompt": "Woran erkennt man laut Text, dass ein Intervall zu lang ist?", "options": ["Der Patient klagt über Langeweile", "Eine Rötung bleibt und lässt sich nicht wegdrücken", "Die Haut ist blass", "Der Patient schläft schlecht"], "answer": 1},
    {"type": "mc", "prompt": "Wann soll das Dekubitusrisiko eingeschätzt werden?", "options": ["Nur bei der Aufnahme", "Bei der Aufnahme und wenn sich der Zustand verändert", "Einmal im Monat", "Nur auf Anordnung des Arztes"], "answer": 1},
    {"type": "mc", "prompt": "Was sagt der Text über Wechseldruckmatratzen?", "options": ["Sie machen Bewegungsförderung überflüssig.", "Sie sind gefährlich.", "Sie können helfen, ersetzen aber die Bewegungsförderung nicht.", "Sie sind verboten."], "answer": 2},
    {"type": "mc", "prompt": "Welche Maßnahme soll man heute NICHT mehr anwenden?", "options": ["Eigenbewegung fördern", "Hautzustand beobachten", "„Eisen und Föhnen“", "Beobachtungen im Team austauschen"], "answer": 2}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000009003', '10000000-0000-4000-8000-000000000901', 'reading',
 'Lesen Teil 3: Angebote im Klinikum', 'Reading part 3: services at the hospital', 3, true, $j${
  "intro_de": "Lies die Angebote A bis F. Welches Angebot passt zu welcher Situation?",
  "intro_en": "Read offers A to F. Which offer matches which situation?",
  "text": "A – Sozialdienst: Beratung zu Reha, Pflegeheim, ambulanten Diensten und Pflegegrad. Mo–Fr 8–16 Uhr, Haus 2, Raum 104.\n\nB – Dolmetscherdienst: Für Gespräche mit Patienten ohne Deutschkenntnisse. Über 30 Sprachen, auch per Video. Anforderung über das Intranet, mindestens 24 Stunden vorher.\n\nC – Klinikseelsorge: Gespräche für Patienten, Angehörige und Mitarbeitende, unabhängig von der Religion. Rund um die Uhr über die Pforte erreichbar.\n\nD – Ernährungsberatung: Beratung bei Diabetes, Mangelernährung und Schluckstörungen. Termine über die Stationsärztin.\n\nE – Betriebsärztlicher Dienst: Impfungen und Untersuchungen für Mitarbeitende, z. B. nach einer Nadelstichverletzung. Mo–Do 7–15 Uhr.\n\nF – Patientenfürsprecherin: Unabhängige Ansprechpartnerin für Beschwerden und Anregungen von Patienten. Sprechstunde dienstags 14–16 Uhr.",
  "time_minutes": 15,
  "questions": [
    {"type": "mc", "prompt": "Eine Kollegin hat sich an einer gebrauchten Kanüle gestochen.", "options": ["A", "C", "E", "F"], "answer": 2},
    {"type": "mc", "prompt": "Ein Patient möchte sich über das Krankenhaus beschweren, aber nicht beim Personal der Station.", "options": ["A", "B", "D", "F"], "answer": 3},
    {"type": "mc", "prompt": "Morgen soll ein Aufklärungsgespräch mit einer Patientin stattfinden, die nur Arabisch spricht.", "options": ["B", "C", "D", "E"], "answer": 0},
    {"type": "mc", "prompt": "Die Familie eines sterbenden Patienten möchte nachts mit jemandem sprechen.", "options": ["A", "C", "E", "F"], "answer": 1},
    {"type": "mc", "prompt": "Eine Patientin wird bald entlassen und braucht zu Hause einen Pflegedienst.", "options": ["A", "B", "D", "F"], "answer": 0}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000009004', '10000000-0000-4000-8000-000000000901', 'quiz',
 'Sprachbausteine: E-Mail an die Stationsleitung', 'Language elements: email to the ward manager', 4, true, $j${
  "intro_de": "Lies die E-Mail. Welches Wort passt in die Lücke? Wähle für jede Lücke (1) bis (10) die richtige Lösung.",
  "intro_en": "Read the email. Which word fits the gap? Choose the correct answer for each gap (1) to (10).",
  "text": "Sehr geehrte Frau Albrecht,\n\nich wende mich an Sie, (1) ich eine Frage zum Dienstplan im Dezember habe. Wie Sie wissen, nehme ich vom 9. bis 11. Dezember an der Fortbildung „Palliativpflege“ teil. Leider bin ich am 10. Dezember (2) Frühdienst eingetragen.\n\nIch habe bereits mit meiner Kollegin Frau Yilmaz gesprochen. Sie wäre bereit, den Dienst mit mir zu (3). Ich würde dafür ihren Spätdienst am 17. Dezember übernehmen. (4) Sie mit diesem Tausch einverstanden sind, würde ich mich sehr freuen.\n\nAußerdem möchte ich Sie fragen, (5) die Kosten für die Fortbildung von der Klinik übernommen werden. In der Ausschreibung steht, dass die Teilnahme für Pflegefachkräfte (6) ist. Ich habe aber noch keine Bestätigung (7).\n\nFür eine kurze Rückmeldung bis Ende der Woche wäre ich Ihnen sehr (8). Gern können wir die Fragen auch persönlich besprechen, (9) Sie das lieber möchten.\n\nVielen Dank im Voraus und (10) Grüße\nAmina Diallo",
  "time_minutes": 15,
  "questions": [
    {"type": "mc", "prompt": "(1)", "options": ["weil", "deshalb", "trotzdem"], "answer": 0},
    {"type": "mc", "prompt": "(2)", "options": ["im", "zum", "für den"], "answer": 2},
    {"type": "mc", "prompt": "(3)", "options": ["tauschen", "wechseln an", "geben"], "answer": 0},
    {"type": "mc", "prompt": "(4)", "options": ["Ob", "Wenn", "Damit"], "answer": 1},
    {"type": "mc", "prompt": "(5)", "options": ["dass", "ob", "wann"], "answer": 1},
    {"type": "mc", "prompt": "(6)", "options": ["kostenlos", "kostenpflichtig", "kostspielig"], "answer": 0},
    {"type": "mc", "prompt": "(7)", "options": ["erhalten", "bekommt", "gegeben"], "answer": 0},
    {"type": "mc", "prompt": "(8)", "options": ["dankbar", "danke", "bedankt"], "answer": 0},
    {"type": "mc", "prompt": "(9)", "options": ["falls", "obwohl", "seit"], "answer": 0},
    {"type": "mc", "prompt": "(10)", "options": ["freundliche", "freundlichen", "freundlicher"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000009005', '10000000-0000-4000-8000-000000000901', 'listening',
 'Hören Teil 1: Nachrichten auf dem Anrufbeantworter', 'Listening part 1: answering machine messages', 5, true, $j${
  "intro_de": "Du hörst drei Nachrichten auf dem Anrufbeantworter der Station. Du hörst den Text zweimal. Beantworte die Fragen.",
  "intro_en": "You will hear three messages on the ward's answering machine. You hear the text twice. Answer the questions.",
  "transcript": "Ansage: Nachricht eins.\nHerr Brandt: Guten Tag, hier spricht Brandt, ich bin der Sohn von Ilse Brandt, Zimmer 7. Ich wollte meine Mutter morgen um 11 Uhr abholen, aber ich habe gehört, dass sich die Entlassung verschiebt. Können Sie mich bitte zurückrufen? Meine Nummer ist 0171 2345678. Danke.\nAnsage: Nachricht zwei.\nFrau Dr. Lindner: Hallo, hier ist Dr. Lindner aus der Radiologie. Die CT-Untersuchung von Herrn Ahmadi aus Zimmer 2 ist von heute 14 Uhr auf morgen früh 8 Uhr verschoben, weil unser Gerät ausgefallen ist. Er muss ab 6 Uhr nüchtern bleiben. Bitte geben Sie das an den Spätdienst weiter.\nAnsage: Nachricht drei.\nHerr Wagner: Guten Morgen, Wagner vom Sanitätshaus Meier. Der Rollator für Frau Kühn kann leider erst übermorgen geliefert werden, nicht wie geplant morgen. Wir bringen ihn direkt zur Patientin nach Hause. Bei Fragen erreichen Sie mich unter 089 765432.",
  "time_minutes": 10,
  "max_plays": 2,
  "questions": [
    {"type": "mc", "prompt": "Nachricht 1: Was möchte Herr Brandt?", "options": ["Seine Mutter besuchen", "Einen Rückruf wegen der Entlassung", "Mit dem Arzt sprechen", "Eine Beschwerde einreichen"], "answer": 1},
    {"type": "mc", "prompt": "Nachricht 2: Warum wird die Untersuchung verschoben?", "options": ["Der Patient ist krank", "Das Gerät ist ausgefallen", "Der Arzt hat keine Zeit", "Der Patient war nicht nüchtern"], "answer": 1},
    {"type": "gap", "prompt": "Nachricht 2: Herr Ahmadi muss ab ___ Uhr nüchtern bleiben.", "answer": "6", "alternatives": ["sechs", "06:00", "6:00"]},
    {"type": "mc", "prompt": "Nachricht 3: Wann kommt der Rollator?", "options": ["Heute", "Morgen", "Übermorgen", "Nächste Woche"], "answer": 2},
    {"type": "mc", "prompt": "Nachricht 3: Wohin wird der Rollator geliefert?", "options": ["Auf die Station", "In das Sanitätshaus", "Zur Patientin nach Hause", "In die Reha"], "answer": 2}
  ],
  "audio_path": "/audio/pp1-hoeren-1.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000009006', '10000000-0000-4000-8000-000000000901', 'listening',
 'Hören Teil 2: Gespräch bei der Visite', 'Listening part 2: conversation during the ward round', 6, true, $j${
  "intro_de": "Du hörst ein Gespräch zwischen einer Pflegefachkraft, einem Arzt und einem Patienten bei der Visite. Du hörst das Gespräch nur einmal. Lies zuerst die Fragen.",
  "intro_en": "You will hear a conversation between a nurse, a doctor and a patient during the ward round. You hear it only once. Read the questions first.",
  "transcript": "Dr. Peters: Guten Morgen, Herr Lorenz. Wie geht es Ihnen heute?\nHerr Lorenz: Ach, Herr Doktor, nicht so gut. Ich habe kaum geschlafen. Das Bein tut immer noch weh.\nDr. Peters: Schwester Ana, wie war die Nacht?\nAna: Herr Lorenz hat um 2 Uhr geklingelt und Schmerzen von 6 angegeben. Er hat die Bedarfsmedikation bekommen, Ibuprofen 400. Danach ging es etwas besser, aber er hat bis zum Morgen nur wenig geschlafen. Die Wunde am Unterschenkel ist gerötet und warm, und heute früh hatte er 38,2 Grad.\nDr. Peters: Das klingt nach einer Wundinfektion. Ich möchte einen Abstrich und eine Blutentnahme mit Entzündungswerten. Und wir beginnen mit einem Antibiotikum. Herr Lorenz, haben Sie Allergien gegen Medikamente?\nHerr Lorenz: Ja, gegen Penicillin. Da bekomme ich Ausschlag.\nDr. Peters: Gut, dass Sie das sagen. Dann nehmen wir Clindamycin, dreimal täglich. Schwester Ana, bitte die Penicillinallergie noch einmal deutlich in der Kurve markieren.\nAna: Mache ich. Soll das Bein weiter hochgelagert werden?\nDr. Peters: Ja, hochlagern und kühlen. Und die Physiotherapie heute bitte absagen, das Bein soll sich erst einmal erholen.\nHerr Lorenz: Und wann kann ich nach Hause?\nDr. Peters: Das hängt von den Entzündungswerten ab. Wenn alles gut läuft, vielleicht Ende der Woche.",
  "time_minutes": 10,
  "max_plays": 1,
  "questions": [
    {"type": "mc", "prompt": "Wie hat Herr Lorenz geschlafen?", "options": ["Sehr gut", "Kaum", "Wie immer", "Er hat die ganze Nacht durchgeschlafen"], "answer": 1},
    {"type": "gap", "prompt": "Heute früh hatte Herr Lorenz eine Temperatur von ___ Grad.", "answer": "38,2", "alternatives": ["38.2"]},
    {"type": "mc", "prompt": "Was vermutet der Arzt?", "options": ["Eine Thrombose", "Eine Wundinfektion", "Einen Knochenbruch", "Eine Allergie"], "answer": 1},
    {"type": "mc", "prompt": "Warum bekommt Herr Lorenz Clindamycin?", "options": ["Weil es billiger ist", "Weil er gegen Penicillin allergisch ist", "Weil er es zu Hause schon nimmt", "Weil es schneller wirkt"], "answer": 1},
    {"type": "mc", "prompt": "Was soll heute abgesagt werden?", "options": ["Die Blutentnahme", "Der Abstrich", "Die Physiotherapie", "Das Antibiotikum"], "answer": 2},
    {"type": "mc", "prompt": "Wann kann Herr Lorenz vielleicht nach Hause?", "options": ["Heute", "Morgen", "Ende der Woche", "In zwei Wochen"], "answer": 2}
  ],
  "audio_path": "/audio/pp1-hoeren-2.mp3"
}$j$::jsonb),

('20000000-0000-4000-8000-000000009007', '10000000-0000-4000-8000-000000000901', 'writing',
 'Schreiben: Pflegebericht und Information an die Ärztin', 'Writing: nursing report and information to the doctor', 7, true, $j${
  "intro_de": "Du hast 30 Minuten Zeit. Schreibe mindestens 150 Wörter.",
  "intro_en": "You have 30 minutes. Write at least 150 words.",
  "task_de": "Du arbeitest im Spätdienst auf einer chirurgischen Station. Schreibe mit den Notizen unten einen Pflegebericht über Frau Simon. Gehe auf alle Punkte ein. Schreibe sachlich und in ganzen Sätzen. Schließe mit einer kurzen Information, was du der Ärztin gemeldet hast und was der Nachtdienst beachten soll.",
  "task_en": "You work the late shift on a surgical ward. Use the notes below to write a nursing report about Mrs Simon. Cover all points. Write objectively in full sentences. End with a short note on what you reported to the doctor and what the night shift should watch.",
  "text": "Notizen Spätdienst, 20.11. – Frau Monika Simon, 71 J., Zimmer 4, Tag 2 nach Hüft-TEP rechts\n\n14:00  Schmerzen re. Hüfte NRS 5 → Metamizol 1 g i. v. (Bedarf) → 15:00 NRS 2\n15:30  1. Mobilisation mit Physio: Gehwagen, 10 m, sicher\n17:00  Verband: Wundsekret blutig, ca. 2 cm Durchmesser, markiert\n18:00  Abendessen: 1/2 Portion; Trinkmenge Spätdienst 800 ml\n19:00  Pat. weinte, sagte: „Ich habe Angst, dass ich nie wieder richtig laufen kann.“ Gespräch geführt\n20:30  Verband: Fleck jetzt ca. 6 cm, RR 102/60 mmHg, P 98/min\n20:35  Dr. Arslan informiert → Verband nicht wechseln, Kontrolle 22 Uhr, Hb morgen früh",
  "hints": ["Schmerzen, Maßnahme und Wirkung", "Mobilisation", "Wunde und Verlauf des Wundsekrets", "Ernährung und Flüssigkeit", "Psychische Situation (sachlich beschreiben)", "Information an die Ärztin und Aufgaben für den Nachtdienst"],
  "min_words": 150,
  "time_minutes": 30,
  "max_points": 20
}$j$::jsonb),

('20000000-0000-4000-8000-000000009008', '10000000-0000-4000-8000-000000000901', 'speaking',
 'Sprechen Teil 1: Sich vorstellen und über den Beruf sprechen', 'Speaking part 1: introducing yourself and your profession', 8, true, $j${
  "intro_de": "Stell dir vor, du sitzt vor der Prüfungskommission. Du hast etwa eine Minute Vorbereitungszeit und sprichst dann frei.",
  "intro_en": "Imagine you are in front of the examiners. You have about one minute to prepare and then speak freely.",
  "task_de": "Stell dich vor und erzähle von deiner bisherigen Arbeit in der Pflege. Gehe auf die Fragen unten ein.",
  "task_en": "Introduce yourself and talk about your previous work in nursing. Answer the questions below.",
  "hints": ["Wo und wie lange hast du bisher in der Pflege gearbeitet?", "Welche Aufgaben hattest du?", "Was gefällt dir an deinem Beruf, was ist schwierig?", "Was ist in Deutschland anders als in deinem Heimatland?"],
  "max_seconds": 150,
  "time_minutes": 5,
  "max_points": 10
}$j$::jsonb),

('20000000-0000-4000-8000-000000009009', '10000000-0000-4000-8000-000000000901', 'speaking',
 'Sprechen Teil 2: Gespräch mit einem Patienten', 'Speaking part 2: conversation with a patient', 9, true, $j${
  "intro_de": "Rollenspiel: Du sprichst mit einem Patienten. Sprich so, als würde er vor dir sitzen. Stelle Fragen und erkläre verständlich.",
  "intro_en": "Role play: you talk to a patient. Speak as if he were sitting in front of you. Ask questions and explain clearly.",
  "task_de": "Herr Vogel (68 J.) soll morgen am Knie operiert werden. Er ist sehr nervös und möchte heute Abend noch rauchen und etwas essen. Führe das Gespräch: Erkläre, was er vor der OP beachten muss, gehe auf seine Angst ein und bereite ihn auf den Ablauf am Morgen vor.",
  "task_en": "Mr Vogel (68) is having knee surgery tomorrow. He is very nervous and wants to smoke and eat something this evening. Explain what he must observe before surgery, respond to his fear and prepare him for the procedure in the morning.",
  "text": "Informationen:\n- Nüchtern ab 24 Uhr (essen), klare Flüssigkeit bis 6 Uhr\n- Rauchen: möglichst ab sofort nicht mehr\n- 6:30 Uhr: Waschen, OP-Hemd, Schmuck und Zahnprothese ablegen\n- 7:15 Uhr: Beruhigungstablette, danach nicht mehr allein aufstehen\n- 7:30 Uhr: Abholung in den OP",
  "hints": ["Begrüßung, nach dem Befinden fragen", "Verständnis für die Angst zeigen", "Regeln erklären und begründen", "Ablauf am Morgen beschreiben, nach Fragen fragen"],
  "max_seconds": 180,
  "time_minutes": 5,
  "max_points": 10
}$j$::jsonb),

('20000000-0000-4000-8000-000000009010', '10000000-0000-4000-8000-000000000901', 'speaking',
 'Sprechen Teil 3: Ärztin informieren (SBAR)', 'Speaking part 3: informing the doctor (SBAR)', 10, true, $j${
  "intro_de": "Du rufst die Dienstärztin an. Sprich strukturiert nach dem SBAR-Schema.",
  "intro_en": "You call the doctor on duty. Speak in a structured way using SBAR.",
  "task_de": "Bei Frau Simon (siehe Teil Schreiben) ist der Verband um 22 Uhr weiter durchgeblutet. Rufe Dr. Arslan an, beschreibe die Situation und bitte um eine klare Anordnung.",
  "task_en": "At 10 pm Mrs Simon's dressing (see writing part) has bled through further. Call Dr Arslan, describe the situation and ask for a clear order.",
  "text": "22:00 Uhr:\n- Blutfleck ca. 12 cm, Verband durchnässt\n- RR 92/55 mmHg, P 112/min, Pat. blass, sagt ihr ist schwindelig\n- Drainage: 250 ml seit 18 Uhr\n- Schmerzen NRS 4\n- Medikamente: Enoxaparin 40 mg s. c. um 18 Uhr",
  "hints": ["S: Wer, welche Station, welcher Patient, welches Problem?", "B: OP, Verlauf seit 20:30 Uhr, Medikamente", "A: Werte und deine Einschätzung", "R: Bitte um Kommen / Anordnung, Anordnung wiederholen"],
  "max_seconds": 150,
  "time_minutes": 5,
  "max_points": 10
}$j$::jsonb)

on conflict (id) do update set module_id = excluded.module_id, kind = excluded.kind, title_de = excluded.title_de,
  title_en = excluded.title_en, sort = excluded.sort, published = excluded.published, content = excluded.content;
