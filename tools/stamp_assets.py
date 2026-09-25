"""Append a content hash to local CSS and JS references in index.html.

The host lets browsers cache files for 10 minutes. Without a version in
the URL, a visitor right after a deploy can get the new HTML with the old
CSS and JS, which renders the page half old, half new. The hash changes
only when the file changes, so unchanged assets stay cached.

Usage: python3 tools/stamp_assets.py   (run after npm run build:css)
"""

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
HASH_LENGTH = 10
LOCAL_ASSET = re.compile(r'(?P<attr>(?:href|src))="(?P<path>(?:\./)?(?:style\.css|app\.js|assets/css/[\w.-]+\.css))(?:\?v=[0-9a-f]+)?"')


def content_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:HASH_LENGTH]


def stamp(match: re.Match) -> str:
    path = match["path"]
    version = content_hash(ROOT / path.removeprefix("./"))
    return f'{match["attr"]}="{path}?v={version}"'


def main() -> None:
    html = INDEX.read_text()
    stamped, count = LOCAL_ASSET.subn(stamp, html)
    INDEX.write_text(stamped)
    print(f"stamped {count} asset references")


if __name__ == "__main__":
    main()
