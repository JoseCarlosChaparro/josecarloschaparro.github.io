"""Stamp index.html for deployment.

1. Append a content hash to local CSS and JS references.
2. Put the hash of every inline executable script into the CSP meta tag.

The host lets browsers cache files for 10 minutes. Without a version in
the URL, a visitor right after a deploy can get the new HTML with the old
CSS and JS, which renders the page half old, half new. The hash changes
only when the file changes, so unchanged assets stay cached.

The CSP allows no inline script except those whose hash it lists, so
editing the inline <head> script without restamping would block it.

Usage: python3 tools/stamp_assets.py   (run after npm run build:css)
"""

import base64
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
HASH_LENGTH = 10
LOCAL_ASSET = re.compile(r'(?P<attr>(?:href|src))="(?P<path>(?:\./)?(?:style\.css|app\.js|assets/css/[\w.-]+\.css))(?:\?v=[0-9a-f]+)?"')


INLINE_SCRIPT = re.compile(r"<script>(?P<body>.*?)</script>", re.S)
CSP_SCRIPT_SRC = re.compile(r"script-src 'self'[^;]*;")


def content_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:HASH_LENGTH]


def stamp(match: re.Match) -> str:
    path = match["path"]
    version = content_hash(ROOT / path.removeprefix("./"))
    return f'{match["attr"]}="{path}?v={version}"'


def script_hash(body: str) -> str:
    digest = hashlib.sha256(body.encode("utf-8")).digest()
    return "'sha256-" + base64.b64encode(digest).decode("ascii") + "'"


def with_inline_script_hashes(html: str) -> tuple[str, int]:
    # Only bare <script> tags run inline; JSON-LD blocks carry a type and are data.
    hashes = [script_hash(m["body"]) for m in INLINE_SCRIPT.finditer(html)]
    directive = "script-src 'self' " + " ".join(hashes) + ";" if hashes else "script-src 'self';"
    updated, count = CSP_SCRIPT_SRC.subn(directive, html)
    if count != 1:
        raise SystemExit("expected exactly one CSP script-src directive in index.html")
    return updated, len(hashes)


def main() -> None:
    html = INDEX.read_text()
    stamped, count = LOCAL_ASSET.subn(stamp, html)
    stamped, scripts = with_inline_script_hashes(stamped)
    INDEX.write_text(stamped)
    print(f"stamped {count} asset references and {scripts} inline script hash(es)")


if __name__ == "__main__":
    main()
