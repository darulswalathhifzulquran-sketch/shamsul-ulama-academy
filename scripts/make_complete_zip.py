#!/usr/bin/env python3
"""Produce one reproducible source ZIP; excludes private data, secrets, git internals."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys

root = Path(__file__).resolve().parents[1]
out = root / "SHAMSUL_ULAMA_ACADEMY_COMPLETE_SOURCE_V15.zip"
include_dirs = ["public", "api", "lib", "pages", "migrations", "docs", "scripts", ".github"]
include_files = ["hatchable.toml", "README.md", "SETUP.txt", "COMPLETE_FILE_MANIFEST.json", ".gitignore"]
excludes = {".git", "__pycache__", "node_modules", ".env", ".venv", "venv", "backups"}
exclude_suffixes = {".sqlite", ".db", ".pem", ".key", ".p12", ".pfx", ".dump", ".sql.gz"}
files = []
for folder in include_dirs:
    directory = root / folder
    if directory.exists():
        for file in directory.rglob("*"):
            if not file.is_file(): continue
            if any(part in excludes or part.startswith(".env") for part in file.relative_to(root).parts): continue
            if any(file.name.endswith(s) for s in exclude_suffixes): continue
            files.append(file)
files.extend(root / f for f in include_files if (root / f).is_file())
with ZipFile(out, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(set(files)):
        archive.write(file, arcname="SHAMSUL_ULAMA_ACADEMY_COMPLETE_V15/" + file.relative_to(root).as_posix())
print(f"Created: {out.name} ({len(set(files))} files, {out.stat().st_size:,} bytes)")
print("Source-code only — no live private PostgreSQL records, passwords or uploaded private media.")
