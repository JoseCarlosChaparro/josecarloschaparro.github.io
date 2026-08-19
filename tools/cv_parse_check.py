#!/usr/bin/env python3
"""
Simula lo que un ATS extrae del CV y señala dónde se rompe.

No usa OCR a propósito: un PDF de LaTeX lleva capa de texto, así que los
sistemas de reclutamiento leen esa capa directamente. El OCR solo entra en
juego con PDFs escaneados, y meterlo aquí daría un resultado que no se
parece al del sistema real.

Uso:  python3 tools/cv_parse_check.py assets/cv/jose-chaparro-cv.pdf
Requiere poppler-utils (pdftotext, pdffonts, pdfinfo).
"""
import re
import subprocess
import sys

OK, WARN, BAD = "  OK  ", " AVISO", " FALLA"


def run(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout


def main(pdf):
    problems = 0

    print(f"\n=== {pdf} ===\n")

    # ---- 1. ¿Hay capa de texto? Si no la hubiera, ahí sí haría falta OCR ----
    fonts = run("pdffonts", pdf)
    embedded = [l for l in fonts.splitlines()[2:] if l.strip()]
    if embedded:
        print(f"{OK} capa de texto presente ({len(embedded)} fuentes incrustadas) — no hace falta OCR")
    else:
        print(f"{BAD} sin fuentes incrustadas: el PDF parece una imagen. Un ATS no leerá nada.")
        problems += 1

    pages = re.search(r"^Pages:\s+(\d+)", run("pdfinfo", pdf), re.M)
    pages = int(pages.group(1)) if pages else 0
    print(f"{OK if pages == 1 else WARN} {pages} página(s)")

    raw = run("pdftotext", pdf, "-")
    lines = [l.rstrip() for l in raw.splitlines()]

    # ---- 2. Campos de contacto, con las mismas regex que usa un parser ----
    print()
    fields = {
        "correo":   r"[\w.\-+]+@[\w.\-]+\.\w+",
        "teléfono": r"\+?\d[\d\s\-().]{7,}\d",
        "LinkedIn": r"linkedin\.com/in/[\w\-]+",
        "GitHub":   r"github\.com/[\w\-]+",
        "sitio":    r"\b[\w\-]+\.com\b",
    }
    for name, pat in fields.items():
        m = re.search(pat, raw)
        if m:
            print(f"{OK} {name:9s} -> {m.group(0)}")
        else:
            print(f"{BAD} {name:9s} -> no extraíble")
            problems += 1

    # ---- 3. El fallo clásico: fechas huérfanas ----
    # \hfill abre un hueco horizontal grande y el extractor lo interpreta como
    # salto de línea, así que el puesto y su periodo terminan en renglones
    # distintos y el parser los empareja mal.
    date_only = re.compile(
        r"^\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})"
        r"\s*[–—\-]{1,2}\s*(Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*$"
    )
    print()
    # Un periodo en renglón propio solo es un problema si la línea anterior NO
    # es el puesto o el título al que pertenece. Los datos de un parser real
    # (OpenResume) mostraron que cuando la línea de arriba es el puesto, la
    # asociación sale bien; marcar todos los casos era un falso positivo.
    ANCHORS = ("Engineer", "Developer", "Bachelor", "Master", "Analyst",
               "Manager", "Architect", "Intern", "Co-founder")
    orphans = []
    for i, l in enumerate(lines):
        if not date_only.match(l):
            continue
        prev = next((lines[j].strip() for j in range(i - 1, -1, -1) if lines[j].strip()), "")
        if not any(a in prev for a in ANCHORS):
            orphans.append((i + 1, l.strip()))
    if orphans:
        print(f"{BAD} {len(orphans)} periodo(s) sueltos, sin puesto ni título en la línea anterior:")
        for n, txt in orphans:
            prev = next((lines[j].strip() for j in range(n - 2, -1, -1) if lines[j].strip()), "")
            print(f"        línea {n}: {txt!r}")
            print(f"           el parser lo asociará a: {prev[:70]!r}")
        problems += 1
    else:
        print(f"{OK} todo periodo suelto queda debajo de su puesto o título")

    # ---- 4. Daño de codificación (ligaduras, acentos) ----
    print()
    suspicious = [c for c in "ﬁﬂﬀ�" if c in raw]
    accents = re.findall(r"[áéíóúñÁÉÍÓÚÑ]", raw)
    if suspicious:
        print(f"{BAD} caracteres rotos en la extracción: {suspicious}")
        problems += 1
    else:
        print(f"{OK} sin ligaduras rotas (glyphtounicode está haciendo su trabajo)")
    print(f"{OK if accents else WARN} {len(accents)} caracteres acentuados sobreviven la extracción")

    # ---- 5. Encabezados que el parser usa para segmentar ----
    print()
    expected = ["Professional Profile", "Technical Skills", "Work Experience", "Education"]
    for h in expected:
        print(f"{OK if h in raw else BAD} encabezado {h!r}")
        if h not in raw:
            problems += 1

    print(f"\n{'-' * 62}")
    print(f"{problems} problema(s). 0 = el CV se extrae como esperas.\n")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "assets/cv/jose-chaparro-cv.pdf"))
