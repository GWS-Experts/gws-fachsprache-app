#!/usr/bin/env python3
"""Erzeugt die Audiodateien (public/audio/*.mp3) für Hörtexte und Dialoge per Sprachausgabe.

Quelle sind die Seed-Dateien in supabase/seed: Jede Lektion mit "audio_path": "/audio/<datei>.mp3"
bekommt eine Datei. Dialoge ("lines") und Hörtexte im Format "Sprecher: Text" (eine Zeile pro
Sprecherwechsel) werden mit verschiedenen Stimmen gelesen.

Zusätzlich liest das Skript die Zuordnungen in fsp_audio_beispielinhalte.sql, damit auch die
Beispiellektionen aus fsp_beispielinhalte.sql vertont werden.

Voraussetzungen:
  pip install piper-tts            # Offline-Sprachausgabe (https://github.com/rhasspy/piper)
  ffmpeg                           # zum Zusammenfügen und als MP3 speichern
  Stimmen (ONNX) aus https://github.com/rhasspy/piper/releases/tag/v0.0.2 :
    voice-de-thorsten-low, voice-de-kerstin-low (CC0), voice-de-ramona-low, voice-de-karlsson-low (M-AILABS)

Aufruf:
  python3 scripts/generate-audio.py --voices /pfad/zu/den/stimmen [--only m4-nachfragen] [--force]
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "supabase" / "seed"
OUT = ROOT / "public" / "audio"

FEMALE = ["kerstin", "ramona"]
MALE = ["thorsten", "karlsson"]

# Feste Stimmen für bekannte Sprecher, damit Männer und Frauen passend klingen.
SPEAKER_VOICES = {
    "Pflegekraft": "kerstin", "Frau Schneider": "ramona", "Dr. Weber": "ramona",
    "Sabine": "kerstin", "Tomasz": "thorsten", "Nachtdienst": "thorsten", "Frühdienst": "kerstin",
    "Frau Keller": "ramona", "Mariam": "kerstin", "Dr. Hartmann": "karlsson", "Daniel": "thorsten",
    "Elif": "kerstin", "Dr. Scholz": "ramona", "Frau Neumann": "ramona", "Olena": "kerstin",
    "Herr Kaya": "karlsson", "Jonas": "thorsten", "Kollegin": "ramona",
    "Ansage": "kerstin", "Herr Brandt": "thorsten", "Frau Dr. Lindner": "ramona", "Herr Wagner": "karlsson",
    "Dr. Peters": "karlsson", "Herr Lorenz": "thorsten", "Ana": "kerstin",
}
# Einzelsprecher (Hörtexte ohne Sprecherangabe) pro Datei.
NARRATOR = {"m2-meldung-arzt": "thorsten", "m3-muendliche-uebergabe": "ramona"}

LESSON_RE = re.compile(r"\('(2\d{7}-[0-9a-f-]+)',\s*'[^']+',\s*'(\w+)',.*?\$j\$(.*?)\$j\$::jsonb", re.S)
EXTRA_RE = re.compile(r"\('(2\d{7}-[0-9a-f-]+)',\s*'(/audio/[^']+\.mp3)'\)")


def lessons():
    found = {}
    for f in sorted(SEED.glob("*.sql")):
        for lesson_id, kind, body in LESSON_RE.findall(f.read_text(encoding="utf-8")):
            found[lesson_id] = (kind, json.loads(body))
    extra = {}
    path = SEED / "fsp_audio_beispielinhalte.sql"
    if path.exists():
        extra = dict(EXTRA_RE.findall(path.read_text(encoding="utf-8")))
    return found, extra


def parse_script(text):
    out = []
    for raw in re.split(r"\n+", text):
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^([^:]{1,40}):\s+(.+)$", line)
        if m and not re.search(r"\d$", m.group(1)):
            out.append((m.group(1).strip(), m.group(2).strip()))
        elif out:
            out[-1] = (out[-1][0], out[-1][1] + " " + line)
        else:
            out.append(("", line))
    return out


def speakable(text):
    # Kleine Hilfen für die Aussprache.
    text = re.sub(r"\bDr\.", "Doktor", text)
    text = re.sub(r"\b(0\d{2,4}) (\d{4,})\b", lambda m: " ".join(m.group(1) + m.group(2)), text)  # Telefonnummern ziffernweise
    return text


def assign_voices(lines, name):
    voices, used_f, used_m = {}, 0, 0
    for speaker, _ in lines:
        if speaker in voices:
            continue
        if speaker in SPEAKER_VOICES:
            voices[speaker] = SPEAKER_VOICES[speaker]
        elif speaker == "":
            voices[speaker] = NARRATOR.get(name, "kerstin")
        else:
            female = bool(re.match(r"^(Frau|Schwester)\b", speaker)) or not re.match(r"^(Herr|Pfleger)\b", speaker) and used_f <= used_m
            voices[speaker] = (FEMALE[used_f % 2] if female else MALE[used_m % 2])
            used_f, used_m = used_f + female, used_m + (not female)
    # Zwei Sprecher mit derselben Stimme? Dann den zweiten umstellen.
    seen = {}
    for speaker, voice in list(voices.items()):
        if voice in seen.values():
            alt = [v for v in (FEMALE if voice in FEMALE else MALE) if v not in seen.values()]
            if alt:
                voices[speaker] = alt[0]
        seen[speaker] = voices[speaker]
    return voices


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", required=True, help="Ordner mit de-<name>-low.onnx(.json)")
    ap.add_argument("--only", help="nur diese Datei (ohne .mp3)")
    ap.add_argument("--force", action="store_true", help="vorhandene Dateien überschreiben")
    ap.add_argument("--length-scale", type=float, default=1.05, help=">1 = langsamer")
    args = ap.parse_args()

    from piper import PiperVoice, SynthesisConfig

    found, extra = lessons()
    jobs = {}
    for lesson_id, (kind, content) in found.items():
        path = content.get("audio_path") or extra.get(lesson_id)
        if not path or not path.startswith("/audio/"):
            continue
        if kind == "dialogue":
            lines = [(l["speaker"], l["text"]) for l in content.get("lines", [])]
        else:
            lines = parse_script(content.get("transcript", ""))
        jobs[Path(path).stem] = lines

    OUT.mkdir(parents=True, exist_ok=True)
    loaded = {}
    config = SynthesisConfig(length_scale=args.length_scale)
    for name, lines in sorted(jobs.items()):
        if args.only and name != args.only:
            continue
        target = OUT / f"{name}.mp3"
        if target.exists() and not args.force:
            print(f"überspringe {target.name} (existiert)")
            continue
        voices = assign_voices(lines, name)
        print(f"{target.name}: {len(lines)} Zeilen, Stimmen {voices}")
        with tempfile.TemporaryDirectory() as tmp:
            parts = []
            for i, (speaker, text) in enumerate(lines):
                voice_name = voices[speaker]
                if voice_name not in loaded:
                    loaded[voice_name] = PiperVoice.load(str(Path(args.voices) / f"de-{voice_name}-low.onnx"))
                wav_path = Path(tmp) / f"{i:03d}.wav"
                with wave.open(str(wav_path), "wb") as wav:
                    loaded[voice_name].synthesize_wav(speakable(text), wav, syn_config=config)
                parts.append(wav_path)
            # Zwischen Sprecherwechseln eine kurze Pause, am Anfang etwas Stille.
            inputs, filters = [], []
            for i, p in enumerate(parts):
                inputs += ["-i", str(p)]
                pause = 0.45 if i == 0 or lines[i][0] == lines[i - 1][0] else 0.7
                filters.append(f"[{i}:a]aresample=22050,adelay={int(pause * 1000)}|{int(pause * 1000)}[a{i}]")
            concat = "".join(f"[a{i}]" for i in range(len(parts)))
            graph = ";".join(filters) + f";{concat}concat=n={len(parts)}:v=0:a=1,apad=pad_dur=0.6[out]"
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph, "-map", "[out]",
                 "-ac", "1", "-ar", "22050", "-b:a", "48k", str(target)],
                check=True,
            )
    print("fertig")


if __name__ == "__main__":
    sys.exit(main())
