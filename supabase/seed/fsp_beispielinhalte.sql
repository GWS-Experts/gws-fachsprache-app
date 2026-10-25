-- Beispielinhalte für die GWS Fachsprache-App: 3 Module mit allen 7 Übungstypen.
-- Kann mehrfach ausgeführt werden (bestehende Einträge werden überschrieben).

insert into fsp.modules (id, slug, title_de, title_en, description_de, description_en, sort, published) values
('10000000-0000-4000-8000-000000000001', 'aufnahme-anamnese', 'Patientenaufnahme und Anamnese', 'Admission and medical history',
 'Patienten begrüßen, das Aufnahmegespräch führen und die Pflegeanamnese erheben.',
 'Greet patients, conduct the admission interview and take the nursing history.', 1, true),
('10000000-0000-4000-8000-000000000002', 'vitalzeichen', 'Vitalzeichen und Krankenbeobachtung', 'Vital signs and patient observation',
 'Vitalwerte messen, beschreiben und Auffälligkeiten an Ärztinnen und Ärzte melden.',
 'Measure and describe vital signs and report abnormalities to doctors.', 2, true),
('10000000-0000-4000-8000-000000000003', 'uebergabe-dokumentation', 'Übergabe und Pflegedokumentation', 'Handover and nursing documentation',
 'Eine strukturierte Übergabe halten, mit Ärzten sprechen und den Pflegebericht schreiben.',
 'Give a structured handover, talk to doctors and write the nursing report.', 3, true)
on conflict (id) do update set title_de = excluded.title_de, title_en = excluded.title_en,
  description_de = excluded.description_de, description_en = excluded.description_en, sort = excluded.sort, published = excluded.published;

insert into fsp.lessons (id, module_id, kind, title_de, title_en, sort, published, content) values

-- Modul 1: Patientenaufnahme und Anamnese ------------------------------------
('20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', 'vocabulary',
 'Wortschatz: Aufnahme', 'Vocabulary: admission', 1, true, $j${
  "intro_de": "Diese Begriffe brauchst du bei jeder Patientenaufnahme. Lerne immer den Artikel und den Plural mit.",
  "intro_en": "You need these terms for every admission. Always learn the article and plural too.",
  "items": [
    {"article": "die", "term": "Anamnese", "plural": "die Anamnesen", "en": "medical history", "example": "Ich erhebe jetzt die Pflegeanamnese."},
    {"article": "die", "term": "Allergie", "plural": "die Allergien", "en": "allergy", "example": "Haben Sie Allergien, zum Beispiel gegen Medikamente?"},
    {"article": "die", "term": "Vorerkrankung", "plural": "die Vorerkrankungen", "en": "pre-existing condition", "example": "Der Patient hat als Vorerkrankung einen Diabetes mellitus Typ 2."},
    {"article": "die", "term": "Dauermedikation", "plural": "", "en": "regular medication", "example": "Bitte nennen Sie mir Ihre Dauermedikation."},
    {"article": "der", "term": "Hausarzt", "plural": "die Hausärzte", "en": "general practitioner (GP)", "example": "Wie heißt Ihr Hausarzt?"},
    {"article": "die", "term": "Patientenverfügung", "plural": "die Patientenverfügungen", "en": "advance directive", "example": "Haben Sie eine Patientenverfügung?"},
    {"article": "der/die", "term": "Angehörige", "plural": "die Angehörigen", "en": "relative", "example": "Dürfen wir Ihre Angehörigen informieren?"},
    {"article": "das", "term": "Hilfsmittel", "plural": "die Hilfsmittel", "en": "aid (e.g. walking frame, glasses)", "example": "Benutzen Sie Hilfsmittel wie einen Rollator oder eine Brille?"},
    {"article": "die", "term": "Unverträglichkeit", "plural": "die Unverträglichkeiten", "en": "intolerance", "example": "Die Patientin hat eine Laktoseunverträglichkeit."},
    {"article": "die", "term": "Krankenversicherungskarte", "plural": "die Krankenversicherungskarten", "en": "health insurance card", "example": "Haben Sie Ihre Krankenversicherungskarte dabei?"}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', 'dialogue',
 'Dialog: Das Aufnahmegespräch', 'Dialogue: the admission interview', 2, true, $j${
  "intro_de": "Pflegefachfrau Priya nimmt Frau Schneider (78) auf der Inneren Station auf. Hör dir den Dialog an und beantworte die Fragen.",
  "intro_en": "Nurse Priya admits Mrs Schneider (78) to the internal medicine ward. Listen to the dialogue and answer the questions.",
  "lines": [
    {"speaker": "Pflegekraft", "text": "Guten Tag, Frau Schneider. Mein Name ist Priya, ich bin heute Ihre zuständige Pflegefachfrau. Ich möchte Ihnen ein paar Fragen zur Aufnahme stellen. Ist das in Ordnung?"},
    {"speaker": "Frau Schneider", "text": "Ja, natürlich. Aber bitte sprechen Sie etwas lauter, ich höre auf dem linken Ohr schlecht."},
    {"speaker": "Pflegekraft", "text": "Gerne. Warum sind Sie heute ins Krankenhaus gekommen?"},
    {"speaker": "Frau Schneider", "text": "Ich habe seit drei Tagen Fieber und huste viel. Heute Morgen hatte ich auch Atemnot."},
    {"speaker": "Pflegekraft", "text": "Haben Sie Allergien, zum Beispiel gegen Medikamente oder Pflaster?"},
    {"speaker": "Frau Schneider", "text": "Ja, gegen Penicillin. Davon bekomme ich einen Ausschlag."},
    {"speaker": "Pflegekraft", "text": "Danke, das notiere ich sofort. Welche Medikamente nehmen Sie regelmäßig?"},
    {"speaker": "Frau Schneider", "text": "Morgens eine Tablette gegen Bluthochdruck und abends eine Wassertablette."},
    {"speaker": "Pflegekraft", "text": "Benutzen Sie Hilfsmittel, zum Beispiel einen Rollator oder ein Hörgerät?"},
    {"speaker": "Frau Schneider", "text": "Zu Hause laufe ich mit dem Rollator. Das Hörgerät habe ich leider vergessen."},
    {"speaker": "Pflegekraft", "text": "Dann bitten wir Ihre Tochter, es mitzubringen. Darf ich sie anrufen?"},
    {"speaker": "Frau Schneider", "text": "Ja, gerne. Die Nummer steht in meinem Handy."}
  ],
  "questions": [
    {"type": "mc", "prompt": "Warum kommt Frau Schneider ins Krankenhaus?", "options": ["Wegen eines Sturzes", "Wegen Fieber, Husten und Atemnot", "Wegen Bauchschmerzen", "Zu einer geplanten Operation"], "answer": 1},
    {"type": "mc", "prompt": "Wogegen ist Frau Schneider allergisch?", "options": ["Gegen Pflaster", "Gegen Ibuprofen", "Gegen Penicillin", "Sie hat keine Allergien"], "answer": 2, "explanation": "Eine Allergie muss sofort und gut sichtbar dokumentiert werden."},
    {"type": "mc", "prompt": "Welches Hilfsmittel fehlt im Krankenhaus?", "options": ["Der Rollator", "Die Brille", "Das Hörgerät", "Die Zahnprothese"], "answer": 2},
    {"type": "gap", "prompt": "Frau Schneider nimmt abends eine ___ (Diuretikum).", "answer": "Wassertablette", "alternatives": ["Wassertabletten"]}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000001', 'quiz',
 'Quiz: Höflich fragen', 'Quiz: asking politely', 3, true, $j${
  "intro_de": "Im Aufnahmegespräch sprichst du Patienten immer mit „Sie“ an und stellst klare W-Fragen.",
  "intro_en": "In the admission interview you always address patients formally (\"Sie\") and ask clear wh-questions.",
  "questions": [
    {"type": "mc", "prompt": "Welche Frage ist im Aufnahmegespräch richtig und höflich?", "options": ["Hast du Schmerzen?", "Haben Sie Schmerzen?", "Schmerzen haben?", "Sie haben Schmerzen, ja oder nein?"], "answer": 1},
    {"type": "mc", "prompt": "Wie fragst du nach der Dauermedikation?", "options": ["Welche Medikamente nehmen Sie regelmäßig?", "Was trinken Sie gern?", "Wann sind Sie geboren?", "Wo wohnen Sie?"], "answer": 0},
    {"type": "gap", "prompt": "___ Medikamente vertragen Sie nicht? (Fragewort)", "answer": "Welche"},
    {"type": "gap", "prompt": "Seit ___ haben Sie diese Beschwerden? (Fragewort)", "answer": "wann"},
    {"type": "mc", "prompt": "Was bedeutet „Patientenverfügung“?", "options": ["Die Rechnung des Krankenhauses", "Ein Dokument, in dem der Patient festlegt, welche Behandlung er im Notfall wünscht", "Die Liste der Medikamente", "Der Entlassungsbrief"], "answer": 1},
    {"type": "mc", "prompt": "Ein Patient versteht dich nicht. Was sagst du?", "options": ["Das habe ich doch schon gesagt.", "Ich erkläre es Ihnen gern noch einmal mit anderen Worten.", "Fragen Sie Ihre Tochter.", "Egal, das ist nicht wichtig."], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000001', 'reading',
 'Lesen: Pflegeanamnese', 'Reading: nursing history', 4, true, $j${
  "intro_de": "Lies den Auszug aus der Pflegeanamnese und beantworte die Fragen.",
  "intro_en": "Read the extract from the nursing history and answer the questions.",
  "text": "Pflegeanamnese – Herr Klaus Becker, 82 Jahre\n\nAufnahmegrund: Herr Becker wurde nach einem Sturz in seiner Wohnung mit Verdacht auf Oberschenkelhalsfraktur rechts aufgenommen.\n\nVorerkrankungen: Herzinsuffizienz, Diabetes mellitus Typ 2, leichte Demenz.\n\nAllergien: keine bekannt.\n\nMobilität: Herr Becker läuft zu Hause mit Rollator. Aktuell ist er bettlägerig und benötigt Hilfe beim Lagewechsel. Es besteht ein erhöhtes Dekubitusrisiko.\n\nErnährung: Diabetische Kost. Herr Becker trinkt zu wenig, laut Tochter etwa 800 ml am Tag.\n\nAusscheidung: Er ist tagsüber kontinent, nachts trägt er eine Inkontinenzhose.\n\nKommunikation: Herr Becker ist zeitlich nicht immer orientiert. Er trägt eine Brille. Die Tochter ist die Betreuerin und Ansprechpartnerin.",
  "questions": [
    {"type": "mc", "prompt": "Warum wurde Herr Becker aufgenommen?", "options": ["Wegen einer Lungenentzündung", "Nach einem Sturz mit Verdacht auf Oberschenkelhalsfraktur", "Wegen hohen Blutzuckers", "Zur Kontrolle der Herzinsuffizienz"], "answer": 1},
    {"type": "mc", "prompt": "Welches Risiko besteht aktuell?", "options": ["Dekubitusrisiko", "Allergierisiko", "Blutungsrisiko", "Kein besonderes Risiko"], "answer": 0, "explanation": "Bettlägerige Patienten haben ein erhöhtes Risiko für ein Druckgeschwür (Dekubitus)."},
    {"type": "mc", "prompt": "Was ist bei der Ernährung auffällig?", "options": ["Er isst zu viel Zucker", "Er trinkt zu wenig", "Er hat eine Laktoseintoleranz", "Er bekommt Sondenkost"], "answer": 1},
    {"type": "gap", "prompt": "Die Ansprechpartnerin und Betreuerin ist seine ___.", "answer": "Tochter"}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000001', 'speaking',
 'Sprechen: Aufnahmegespräch führen', 'Speaking: conduct an admission interview', 5, true, $j${
  "intro_de": "In der Prüfung führst du ein Gespräch mit einer Patientin oder einem Patienten. Übe das hier mit einer Aufnahme.",
  "intro_en": "In the exam you have a conversation with a patient. Practise it here with a recording.",
  "task_de": "Stell dich einem neuen Patienten, Herrn Wagner (65), vor. Erkläre, was du jetzt machst, und stelle ihm mindestens fünf Fragen zur Aufnahme.",
  "task_en": "Introduce yourself to a new patient, Mr Wagner (65). Explain what you are going to do and ask him at least five admission questions.",
  "hints": ["Begrüßung und Vorstellung: Name, Funktion", "Grund der Aufnahme und Beschwerden", "Allergien und Unverträglichkeiten", "Dauermedikation und Vorerkrankungen", "Hilfsmittel und Angehörige", "Höflich abschließen: „Haben Sie noch Fragen?“"],
  "max_seconds": 120
}$j$::jsonb),

-- Modul 2: Vitalzeichen und Krankenbeobachtung -------------------------------
('20000000-0000-4000-8000-000000000201', '10000000-0000-4000-8000-000000000002', 'vocabulary',
 'Wortschatz: Vitalzeichen', 'Vocabulary: vital signs', 1, true, $j${
  "intro_de": "Wichtige Begriffe, um Vitalzeichen zu messen und zu beschreiben.",
  "intro_en": "Important terms for measuring and describing vital signs.",
  "items": [
    {"article": "der", "term": "Blutdruck", "plural": "", "en": "blood pressure", "example": "Der Blutdruck liegt bei 150 zu 90."},
    {"article": "der", "term": "Puls", "plural": "", "en": "pulse", "example": "Der Puls ist regelmäßig, 76 Schläge pro Minute."},
    {"article": "die", "term": "Körpertemperatur", "plural": "", "en": "body temperature", "example": "Die Körpertemperatur beträgt 38,6 Grad."},
    {"article": "die", "term": "Atemfrequenz", "plural": "die Atemfrequenzen", "en": "respiratory rate", "example": "Die Atemfrequenz ist mit 26 pro Minute erhöht."},
    {"article": "die", "term": "Sauerstoffsättigung", "plural": "", "en": "oxygen saturation", "example": "Die Sauerstoffsättigung ist auf 89 Prozent gefallen."},
    {"article": "das", "term": "Fieber", "plural": "", "en": "fever", "example": "Der Patient hat seit gestern Fieber."},
    {"article": "die", "term": "Atemnot", "plural": "", "en": "shortness of breath", "example": "Die Patientin klagt über Atemnot."},
    {"article": "der", "term": "Blutzucker", "plural": "", "en": "blood sugar", "example": "Ich messe vor dem Essen den Blutzucker."},
    {"article": "", "term": "schwindelig", "plural": "", "en": "dizzy", "example": "Mir ist beim Aufstehen schwindelig."},
    {"article": "", "term": "blass", "plural": "", "en": "pale", "example": "Der Patient ist blass und schwitzt stark."}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000002', 'listening',
 'Hören: Meldung an den Arzt', 'Listening: reporting to the doctor', 2, true, $j${
  "intro_de": "Eine Pflegekraft ruft den diensthabenden Arzt an. Hör gut zu und notiere die Werte.",
  "intro_en": "A nurse calls the doctor on duty. Listen carefully and note the values.",
  "transcript": "Guten Abend, Herr Doktor Lange, hier ist Pflegefachmann Arjun von der Station 4B. Ich rufe wegen Herrn Yilmaz in Zimmer 12 an. Herr Yilmaz ist 70 Jahre alt und wurde gestern nach einer Hüftoperation verlegt. Seit einer Stunde ist er unruhig und klagt über Atemnot. Ich habe gerade die Vitalzeichen gemessen: Der Blutdruck liegt bei 95 zu 60, der Puls ist mit 118 pro Minute erhöht. Die Körpertemperatur beträgt 38,9 Grad. Die Sauerstoffsättigung liegt ohne Sauerstoff bei 88 Prozent. Ich habe ihm bereits zwei Liter Sauerstoff über die Nasenbrille gegeben und den Oberkörper hochgelagert. Können Sie bitte zeitnah vorbeikommen?",
  "questions": [
    {"type": "mc", "prompt": "Warum ruft der Pflegefachmann an?", "options": ["Der Patient möchte nach Hause", "Der Patient ist unruhig und hat Atemnot", "Der Patient hat Hunger", "Der Patient ist gestürzt"], "answer": 1},
    {"type": "mc", "prompt": "Wie hoch ist der Puls?", "options": ["76 pro Minute", "95 pro Minute", "118 pro Minute", "60 pro Minute"], "answer": 2},
    {"type": "gap", "prompt": "Die Körpertemperatur beträgt ___ Grad.", "answer": "38,9", "alternatives": ["38.9"]},
    {"type": "mc", "prompt": "Welche Maßnahmen hat er schon ergriffen?", "options": ["Er hat ein Schmerzmittel gegeben", "Er hat Sauerstoff gegeben und den Oberkörper hochgelagert", "Er hat die Angehörigen angerufen", "Er hat nichts gemacht"], "answer": 1},
    {"type": "gap", "prompt": "Die Sauerstoffsättigung liegt bei ___ Prozent.", "answer": "88"}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000002', 'quiz',
 'Quiz: Normwerte und Auffälligkeiten', 'Quiz: normal values and abnormalities', 3, true, $j${
  "intro_de": "Kennst du die Normwerte bei Erwachsenen und die passenden Fachausdrücke?",
  "intro_en": "Do you know the normal adult values and the right technical terms?",
  "questions": [
    {"type": "mc", "prompt": "Wie nennt man einen Puls über 100 Schläge pro Minute?", "options": ["Bradykardie", "Tachykardie", "Hypotonie", "Apnoe"], "answer": 1},
    {"type": "mc", "prompt": "Ab welcher Temperatur spricht man in der Regel von Fieber?", "options": ["Ab 37,0 °C", "Ab 37,5 °C", "Ab 38,0 °C", "Ab 39,5 °C"], "answer": 2, "explanation": "37,5 bis 38,0 °C gilt als subfebril (erhöhte Temperatur)."},
    {"type": "mc", "prompt": "Was ist eine normale Atemfrequenz bei Erwachsenen in Ruhe?", "options": ["4 bis 8 pro Minute", "12 bis 20 pro Minute", "30 bis 40 pro Minute", "60 bis 80 pro Minute"], "answer": 1},
    {"type": "gap", "prompt": "Ein zu niedriger Blutdruck heißt Hypo___.", "answer": "tonie", "alternatives": ["Hypotonie"]},
    {"type": "mc", "prompt": "Welcher Satz passt in eine Meldung an den Arzt?", "options": ["Der Patient sieht irgendwie komisch aus.", "Der Patient ist seit 20 Minuten kaltschweißig, der Blutdruck ist auf 85/50 mmHg gefallen.", "Ich glaube, es geht ihm nicht so gut.", "Vielleicht hat er Fieber, ich habe nicht gemessen."], "answer": 1, "explanation": "Melde immer konkret: Beobachtung, seit wann, Messwerte."},
    {"type": "gap", "prompt": "Die Sauerstoffsättigung misst man mit einem Pulsoxi___.", "answer": "meter", "alternatives": ["Pulsoximeter"]}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000204', '10000000-0000-4000-8000-000000000002', 'writing',
 'Schreiben: Pflegebericht bei Fieber', 'Writing: nursing report on fever', 4, true, $j${
  "intro_de": "In der Prüfung schreibst du einen Eintrag in die Pflegedokumentation. Schreibe sachlich, im Präteritum oder Perfekt, ohne eigene Bewertung.",
  "intro_en": "In the exam you write an entry in the nursing documentation. Write objectively, in past tense, without personal judgement.",
  "task_de": "Schreibe einen Pflegebericht für den Spätdienst über Herrn Yilmaz. Nutze die Informationen im Material.",
  "task_en": "Write a nursing report for the late shift about Mr Yilmaz. Use the information in the material.",
  "text": "Material:\n- 14:00 Uhr: Herr Yilmaz klagt über Schüttelfrost.\n- 14:10 Uhr: Temperatur 39,1 °C, Puls 104/min, RR 110/70 mmHg, SpO2 94 %\n- Information an Dr. Lange, Blutkulturen abgenommen\n- 14:30 Uhr: Paracetamol 1 g i.v. nach ärztlicher Anordnung\n- Wadenwickel angelegt, Bettwäsche gewechselt\n- 15:30 Uhr: Temperatur 38,2 °C, Patient schläft",
  "hints": ["Uhrzeit, Beobachtung, Messwerte", "Maßnahmen und wer sie angeordnet hat", "Wirkung der Maßnahmen", "Was der nächste Dienst beachten soll"],
  "min_words": 80
}$j$::jsonb),

-- Modul 3: Übergabe und Pflegedokumentation ----------------------------------
('20000000-0000-4000-8000-000000000301', '10000000-0000-4000-8000-000000000003', 'reading',
 'Lesen: Das Übergabeprotokoll', 'Reading: the handover report', 1, true, $j${
  "intro_de": "Viele Stationen übergeben nach dem Schema ISBAR: Identifikation, Situation, Hintergrund, Einschätzung, Empfehlung.",
  "intro_en": "Many wards use the ISBAR scheme for handovers: identify, situation, background, assessment, recommendation.",
  "text": "Übergabe Frühdienst an Spätdienst, Zimmer 7\n\nI – Frau Maria Hoffmann, 74 Jahre, Tag 2 nach Implantation einer Knieprothese links.\n\nS – Frau Hoffmann hatte heute Vormittag Schmerzen von 6 auf der Skala von 0 bis 10. Nach der Gabe von Metamizol um 10 Uhr sind die Schmerzen auf 3 gesunken.\n\nB – Sie hat einen Bluthochdruck und nimmt Ramipril. Sie ist allergisch gegen Jod.\n\nA – Der Verband ist trocken. Die Patientin war heute mit Physiotherapie und Rollator zweimal auf dem Flur. Sie trinkt gut, etwa 1,5 Liter.\n\nR – Bitte um 16 Uhr Schmerzen erneut einschätzen. Die Drainage soll morgen gezogen werden. Die Tochter kommt um 17 Uhr zu Besuch und hat Fragen zur Entlassung.",
  "questions": [
    {"type": "mc", "prompt": "Welche Operation hatte Frau Hoffmann?", "options": ["Hüftprothese rechts", "Knieprothese links", "Blinddarm-Operation", "Herzkatheter"], "answer": 1},
    {"type": "mc", "prompt": "Wie stark waren die Schmerzen nach dem Medikament?", "options": ["6 von 10", "3 von 10", "0 von 10", "9 von 10"], "answer": 1},
    {"type": "mc", "prompt": "Wogegen ist Frau Hoffmann allergisch?", "options": ["Gegen Jod", "Gegen Metamizol", "Gegen Ramipril", "Gegen Latex"], "answer": 0},
    {"type": "gap", "prompt": "Um ___ Uhr sollen die Schmerzen erneut eingeschätzt werden.", "answer": "16"},
    {"type": "mc", "prompt": "Wofür steht das „R“ in ISBAR?", "options": ["Risiko", "Rückfrage", "Empfehlung (Recommendation)", "Ruhephase"], "answer": 2}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000302', '10000000-0000-4000-8000-000000000003', 'listening',
 'Hören: Mündliche Übergabe', 'Listening: verbal handover', 2, true, $j${
  "intro_de": "Hör dir die mündliche Übergabe an und beantworte die Fragen.",
  "intro_en": "Listen to the verbal handover and answer the questions.",
  "transcript": "Dann kommen wir zu Zimmer 9, Herr Peter Schulz, 58 Jahre. Er ist gestern mit einer Lungenentzündung aufgenommen worden. Er bekommt dreimal täglich ein Antibiotikum über die Vene, die nächste Gabe ist um 14 Uhr. Heute Nacht hatte er noch 38,4 Grad Fieber, heute Morgen waren es 37,6 Grad. Er hustet viel, der Auswurf ist gelblich. Er braucht zwei Liter Sauerstoff, die Sättigung liegt damit bei 94 Prozent. Er darf mit Begleitung aufstehen. Wichtig: Er ist Raucher und hat heute schon zweimal gefragt, ob er nach draußen darf. Bitte noch einmal mit ihm darüber sprechen.",
  "questions": [
    {"type": "mc", "prompt": "Warum ist Herr Schulz im Krankenhaus?", "options": ["Wegen einer Lungenentzündung", "Wegen eines Herzinfarkts", "Nach einem Unfall", "Wegen Diabetes"], "answer": 0},
    {"type": "gap", "prompt": "Die nächste Antibiotikagabe ist um ___ Uhr.", "answer": "14"},
    {"type": "mc", "prompt": "Wie viel Sauerstoff bekommt er?", "options": ["Keinen", "Einen Liter", "Zwei Liter", "Sechs Liter"], "answer": 2},
    {"type": "mc", "prompt": "Worüber soll der Spätdienst mit ihm sprechen?", "options": ["Über seine Entlassung", "Über das Rauchen", "Über das Essen", "Über seine Familie"], "answer": 1}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000303', '10000000-0000-4000-8000-000000000003', 'dialogue',
 'Dialog: Rücksprache mit der Ärztin', 'Dialogue: consulting the doctor', 3, true, $j${
  "intro_de": "Pflegefachfrau Anjali spricht bei der Visite mit Dr. Weber über die Schmerzen von Frau Hoffmann.",
  "intro_en": "Nurse Anjali talks to Dr Weber during the ward round about Mrs Hoffmann's pain.",
  "lines": [
    {"speaker": "Pflegekraft", "text": "Frau Dr. Weber, darf ich kurz etwas zu Frau Hoffmann in Zimmer 7 sagen?"},
    {"speaker": "Dr. Weber", "text": "Ja, bitte. Wie geht es ihr?"},
    {"speaker": "Pflegekraft", "text": "Sie hat seit heute Nacht stärkere Schmerzen im linken Knie, auf der Skala gibt sie 7 an. Das Knie ist warm und geschwollen."},
    {"speaker": "Dr. Weber", "text": "Hat sie Fieber?"},
    {"speaker": "Pflegekraft", "text": "Die Temperatur liegt bei 37,9 Grad. Um 6 Uhr hat sie Metamizol bekommen, das hat nur wenig geholfen."},
    {"speaker": "Dr. Weber", "text": "Gut, dass Sie das melden. Ich schaue mir das Knie gleich an. Nehmen Sie bitte Blut ab, ich möchte die Entzündungswerte sehen."},
    {"speaker": "Pflegekraft", "text": "Mache ich. Soll ich das Knie bis dahin kühlen?"},
    {"speaker": "Dr. Weber", "text": "Ja, bitte kühlen und hochlagern. Ich komme in zehn Minuten."}
  ],
  "questions": [
    {"type": "mc", "prompt": "Wie stark sind die Schmerzen?", "options": ["3 von 10", "5 von 10", "7 von 10", "10 von 10"], "answer": 2},
    {"type": "mc", "prompt": "Was soll die Pflegekraft zuerst tun?", "options": ["Ein Schmerzmittel geben", "Blut abnehmen", "Die Tochter anrufen", "Die Patientin mobilisieren"], "answer": 1},
    {"type": "gap", "prompt": "Das Knie soll gekühlt und ___ werden.", "answer": "hochgelagert"}
  ]
}$j$::jsonb),

('20000000-0000-4000-8000-000000000304', '10000000-0000-4000-8000-000000000003', 'writing',
 'Schreiben: Übergabebericht', 'Writing: handover report', 4, true, $j${
  "intro_de": "Schreibe einen schriftlichen Übergabebericht nach dem ISBAR-Schema.",
  "intro_en": "Write a written handover report using the ISBAR scheme.",
  "task_de": "Du übergibst Herrn Schulz (Zimmer 9) an den Nachtdienst. Schreibe einen Übergabebericht nach ISBAR mit den Informationen aus dem Material.",
  "task_en": "You are handing over Mr Schulz (room 9) to the night shift. Write a handover report using ISBAR with the information in the material.",
  "text": "Material:\n- Herr Peter Schulz, 58 Jahre, Pneumonie, Tag 2\n- Antibiotikum i.v. 3x täglich, nächste Gabe 22 Uhr\n- 18 Uhr: Temperatur 37,4 °C, SpO2 95 % mit 2 l O2\n- Husten mit gelblichem Auswurf, Atemübungen gemacht\n- hat 1,2 l getrunken\n- möchte rauchen, wurde über Risiken informiert\n- Ehefrau ruft am Abend an",
  "hints": ["I – wer: Name, Alter, Diagnose", "S – aktueller Zustand", "B – wichtige Hintergründe", "A – deine Einschätzung", "R – was der Nachtdienst tun soll"],
  "min_words": 100
}$j$::jsonb),

('20000000-0000-4000-8000-000000000305', '10000000-0000-4000-8000-000000000003', 'speaking',
 'Sprechen: Mündliche Übergabe halten', 'Speaking: give a verbal handover', 5, true, $j${
  "intro_de": "Halte eine mündliche Übergabe für eine Patientin. Sprich klar und strukturiert.",
  "intro_en": "Give a verbal handover for a patient. Speak clearly and in a structured way.",
  "task_de": "Übergib Frau Hoffmann (Zimmer 7) mündlich an den Spätdienst. Nutze das ISBAR-Schema und die Informationen aus der Lektion „Lesen: Das Übergabeprotokoll“.",
  "task_en": "Give a verbal handover of Mrs Hoffmann (room 7) to the late shift. Use ISBAR and the information from the lesson \"Reading: the handover report\".",
  "hints": ["Beginne mit Name, Alter und Diagnose", "Nenne Schmerzwerte und Medikamente mit Uhrzeit", "Allergie gegen Jod nicht vergessen", "Schließe mit klaren Aufgaben für den Spätdienst"],
  "max_seconds": 150
}$j$::jsonb),

('20000000-0000-4000-8000-000000000306', '10000000-0000-4000-8000-000000000003', 'quiz',
 'Quiz: Dokumentationssprache', 'Quiz: documentation language', 6, true, $j${
  "intro_de": "In der Pflegedokumentation schreibst du sachlich und meist in der Vergangenheit.",
  "intro_en": "In nursing documentation you write objectively and mostly in the past tense.",
  "questions": [
    {"type": "mc", "prompt": "Welcher Satz ist sachlich dokumentiert?", "options": ["Der Patient war heute total nervig.", "Der Patient lehnte um 12 Uhr das Mittagessen ab.", "Der Patient hat wohl keinen Hunger, glaube ich.", "Patient blöd drauf."], "answer": 1},
    {"type": "gap", "prompt": "Ich ___ den Verband um 9 Uhr gewechselt. (haben, Perfekt)", "answer": "habe"},
    {"type": "gap", "prompt": "Die Patientin ___ über Übelkeit. (klagen, Präteritum)", "answer": "klagte"},
    {"type": "mc", "prompt": "Was bedeutet „i.v.“?", "options": ["In die Vene (intravenös)", "In den Muskel", "Unter die Haut", "Über den Mund"], "answer": 0},
    {"type": "mc", "prompt": "Wie heißt die richtige Abkürzung für Blutdruck in der Dokumentation?", "options": ["BZ", "RR", "SpO2", "AF"], "answer": 1, "explanation": "RR steht für Riva-Rocci, den Erfinder der Blutdruckmessung."},
    {"type": "gap", "prompt": "Nach ärztlicher ___ wurde ein Schmerzmittel verabreicht.", "answer": "Anordnung"}
  ]
}$j$::jsonb)

on conflict (id) do update set module_id = excluded.module_id, kind = excluded.kind, title_de = excluded.title_de,
  title_en = excluded.title_en, sort = excluded.sort, published = excluded.published, content = excluded.content;
