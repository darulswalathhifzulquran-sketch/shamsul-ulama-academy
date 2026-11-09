#!/usr/bin/env python3
"""Quick source backup completeness check; no dependencies or network required."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
required = [
    "README.md", "hatchable.toml", "public/index.html",
    "public/assets/site.js", "public/assets/site.css",
    "public/assets/public-cms.js", "public/assets/staff.js",
    "lib/academy-auth.js", "lib/academy-staff-document.js",
    "pages/staff.js", "pages/dashboard.js",
    "api/academy/students.js",
    "api/academy/students-bulk-delete.js",
    "api/academy/applications.js", "api/academy/gallery.js",
    "api/academy/accounts.js", "api/identity/login.js",
    "migrations/0014_admin_bulk_student_delete.sql",
    "docs/COMPLETE_SETUP.md"
]
missing = [path for path in required if not (root/path).is_file()]
migrations = sorted((root/"migrations").glob("*.sql"))
expected = [f"{i:04d}" for i in range(1,15)]
present = [p.stem.split("_",1)[0] for p in migrations]
print("Shamsul Ulama — Complete v15 source validation")
print(f"Required files: {len(required)-len(missing)}/{len(required)}")
print(f"SQL migrations: {len(migrations)} (expected 14)")
if missing: print("Missing: " + ", ".join(missing))
if present != expected: print("Migration numbers unexpected: " + ", ".join(present))
else: print("Migration ordering: OK")
print("Important: live PostgreSQL DATA, private uploads and secrets are not stored in this source backup.")
sys.exit(0 if not missing and present == expected else 1)
