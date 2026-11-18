#!/usr/bin/env python3
"""
Build assets/db/content.db from scripts/hymns_extracted.json.

Builds into scripts/content_staging.db inside a transaction, runs SQLite
integrity, foreign-key, orphan, count, and FTS5 search validations, then
atomically replaces assets/db/content.db (and syncs assets/content.db if present).
"""

import datetime
import hashlib
import json
import os
import re
import shutil
import sqlite3
import unicodedata

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
EXTRACTED_JSON = os.path.join(SCRIPTS_DIR, "hymns_extracted.json")
STAGING_DB = os.path.join(SCRIPTS_DIR, "content_staging.db")
TARGET_DB = os.path.join(ROOT_DIR, "assets", "db", "content.db")
DUPLICATE_DB = os.path.join(ROOT_DIR, "assets", "content.db")
REPORT_PATH = os.path.join(SCRIPTS_DIR, "db_migration_report.txt")

DB_VERSION = "3"
SOURCE_DOCUMENT = "HYMN_JHS_ENGLISH_PRINT.docx"


def normalize_sort_key(text: str) -> str:
    """Normalize text for alphabetical sorting (strip leading quotes/punctuation, lowercase)."""
    if not text:
        return ""
    t = unicodedata.normalize("NFKD", text)
    t = t.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    t = t.lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def clean_line(text: str) -> str:
    """Trim outer whitespace and collapse trailing spaces on each line."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.strip().splitlines()]
    return "\n".join(lines).strip()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def build_staging_db(hymns: list[dict], source_sha256: str) -> dict:
    if os.path.exists(STAGING_DB):
        os.remove(STAGING_DB)

    conn = sqlite3.connect(STAGING_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = DELETE;")
    conn.execute("PRAGMA page_size = 4096;")

    try:
        with conn:
            conn.executescript(
                """
                CREATE TABLE hymn_sections (
                  id INTEGER PRIMARY KEY,
                  name TEXT NOT NULL,
                  sort_order INTEGER NOT NULL
                );

                CREATE TABLE hymns (
                  id INTEGER PRIMARY KEY,
                  number INTEGER NOT NULL UNIQUE,
                  title TEXT NOT NULL,
                  first_line TEXT,
                  section_id INTEGER NOT NULL REFERENCES hymn_sections(id)
                );

                CREATE TABLE hymn_stanzas (
                  id INTEGER PRIMARY KEY,
                  hymn_id INTEGER NOT NULL REFERENCES hymns(id),
                  stanza_type TEXT NOT NULL CHECK (stanza_type IN ('verse','chorus')),
                  stanza_number INTEGER NOT NULL,
                  text TEXT NOT NULL
                );

                CREATE TABLE hymn_index_entries (
                  id INTEGER PRIMARY KEY,
                  index_type TEXT NOT NULL CHECK (index_type IN ('topical','general','first_lines')),
                  entry_text TEXT NOT NULL,
                  hymn_id INTEGER REFERENCES hymns(id)
                );

                CREATE VIRTUAL TABLE hymn_fts USING fts5(
                  title,
                  first_line,
                  text,
                  content=''
                );

                CREATE TABLE content_metadata (
                  key TEXT PRIMARY KEY,
                  value TEXT NOT NULL
                );

                CREATE INDEX idx_hymns_section ON hymns(section_id);
                CREATE INDEX idx_stanzas_hymn ON hymn_stanzas(hymn_id);
                CREATE INDEX idx_index_type ON hymn_index_entries(index_type);
                """
            )

            # 1. Insert 22 sections in document order (1..22)
            sections_map: dict[int, str] = {}
            for h in hymns:
                so = int(h["section_sort_order"])
                sname = h["section"].strip()
                if so not in sections_map:
                    sections_map[so] = sname
                elif sections_map[so] != sname:
                    raise ValueError(f"Conflicting section name for sort_order {so}: {sections_map[so]} vs {sname}")

            for so in sorted(sections_map.keys()):
                conn.execute(
                    "INSERT INTO hymn_sections (id, name, sort_order) VALUES (?, ?, ?)",
                    (so, sections_map[so], so),
                )

            # 2. Insert hymns, stanzas, and FTS5 rows
            total_stanzas = 0
            cleaned_hymns = []
            for h in sorted(hymns, key=lambda x: int(x["number"])):
                num = int(h["number"])
                title = clean_line(h["title"])
                first_line = clean_line(h.get("first_line") or "")
                section_id = int(h["section_sort_order"])

                conn.execute(
                    "INSERT INTO hymns (id, number, title, first_line, section_id) VALUES (?, ?, ?, ?, ?)",
                    (num, num, title, first_line, section_id),
                )

                stanza_texts = []
                for st in h["stanzas"]:
                    stype = st["type"]
                    snum = int(st["number"])
                    stext = clean_line(st["text"])
                    conn.execute(
                        "INSERT INTO hymn_stanzas (hymn_id, stanza_type, stanza_number, text) VALUES (?, ?, ?, ?)",
                        (num, stype, snum, stext),
                    )
                    stanza_texts.append(stext)
                    total_stanzas += 1

                combined_text = "\n\n".join(stanza_texts)
                conn.execute(
                    "INSERT INTO hymn_fts (rowid, title, first_line, text) VALUES (?, ?, ?, ?)",
                    (num, title, first_line, combined_text),
                )

                cleaned_hymns.append({
                    "id": num,
                    "number": num,
                    "title": title,
                    "first_line": first_line,
                    "section_id": section_id,
                    "section_name": sections_map[section_id],
                })

            # 3. Insert hymn_index_entries
            # 3a. Topical: grouped by section sort_order, then normalized title
            topical_sorted = sorted(
                cleaned_hymns,
                key=lambda x: (x["section_id"], normalize_sort_key(x["title"]), x["number"]),
            )
            for item in topical_sorted:
                entry_text = f"{item['section_name']} — {item['title']}"
                conn.execute(
                    "INSERT INTO hymn_index_entries (index_type, entry_text, hymn_id) VALUES ('topical', ?, ?)",
                    (entry_text, item["id"]),
                )

            # 3b. General: all hymns sorted alphabetically by normalized title
            general_sorted = sorted(
                cleaned_hymns,
                key=lambda x: (normalize_sort_key(x["title"]), x["number"]),
            )
            for item in general_sorted:
                conn.execute(
                    "INSERT INTO hymn_index_entries (index_type, entry_text, hymn_id) VALUES ('general', ?, ?)",
                    (item["title"], item["id"]),
                )

            # 3c. First lines: all hymns sorted alphabetically by normalized first_line
            first_lines_sorted = sorted(
                cleaned_hymns,
                key=lambda x: (normalize_sort_key(x["first_line"]), x["number"]),
            )
            for item in first_lines_sorted:
                conn.execute(
                    "INSERT INTO hymn_index_entries (index_type, entry_text, hymn_id) VALUES ('first_lines', ?, ?)",
                    (item["first_line"], item["id"]),
                )

            # 4. Metadata
            imported_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
            meta = {
                "version": DB_VERSION,
                "source_document": SOURCE_DOCUMENT,
                "sha256_checksum": source_sha256,
                "hymn_count": str(len(cleaned_hymns)),
                "section_count": str(len(sections_map)),
                "stanza_count": str(total_stanzas),
                "imported_at": imported_at,
            }
            for k, v in meta.items():
                conn.execute(
                    "INSERT INTO content_metadata (key, value) VALUES (?, ?)",
                    (k, v),
                )

        conn.execute("VACUUM;")
        stats = validate_db(conn, len(cleaned_hymns), len(sections_map), total_stanzas)
        return stats
    finally:
        conn.close()


def validate_db(conn: sqlite3.Connection, expected_hymns: int, expected_sections: int, expected_stanzas: int) -> dict:
    integrity = conn.execute("PRAGMA integrity_check;").fetchone()[0]
    if integrity != "ok":
        raise RuntimeError(f"SQLite integrity_check failed: {integrity}")

    fk_errors = conn.execute("PRAGMA foreign_key_check;").fetchall()
    if fk_errors:
        raise RuntimeError(f"SQLite foreign_key_check failed: {fk_errors}")

    counts = {
        "hymn_sections": conn.execute("SELECT COUNT(*) FROM hymn_sections").fetchone()[0],
        "hymns": conn.execute("SELECT COUNT(*) FROM hymns").fetchone()[0],
        "hymn_stanzas": conn.execute("SELECT COUNT(*) FROM hymn_stanzas").fetchone()[0],
        "hymn_fts": conn.execute("SELECT COUNT(*) FROM hymn_fts").fetchone()[0],
        "index_topical": conn.execute("SELECT COUNT(*) FROM hymn_index_entries WHERE index_type='topical'").fetchone()[0],
        "index_general": conn.execute("SELECT COUNT(*) FROM hymn_index_entries WHERE index_type='general'").fetchone()[0],
        "index_first_lines": conn.execute("SELECT COUNT(*) FROM hymn_index_entries WHERE index_type='first_lines'").fetchone()[0],
    }

    assert counts["hymn_sections"] == expected_sections, counts
    assert counts["hymns"] == expected_hymns, counts
    assert counts["hymn_stanzas"] == expected_stanzas, counts
    assert counts["hymn_fts"] == expected_hymns, counts
    assert counts["index_topical"] == expected_hymns, counts
    assert counts["index_general"] == expected_hymns, counts
    assert counts["index_first_lines"] == expected_hymns, counts

    # Orphan checks
    orphan_hymns = conn.execute("SELECT COUNT(*) FROM hymns WHERE section_id NOT IN (SELECT id FROM hymn_sections)").fetchone()[0]
    orphan_stanzas = conn.execute("SELECT COUNT(*) FROM hymn_stanzas WHERE hymn_id NOT IN (SELECT id FROM hymns)").fetchone()[0]
    orphan_index = conn.execute("SELECT COUNT(*) FROM hymn_index_entries WHERE hymn_id NOT IN (SELECT id FROM hymns)").fetchone()[0]
    id_num_mismatch = conn.execute("SELECT COUNT(*) FROM hymns WHERE id != number").fetchone()[0]
    if orphan_hymns or orphan_stanzas or orphan_index or id_num_mismatch:
        raise RuntimeError(
            f"Orphan/mismatch check failed: hymns={orphan_hymns}, stanzas={orphan_stanzas}, index={orphan_index}, id!=num={id_num_mismatch}"
        )

    # FTS5 search tests (title, first_line, lyrics)
    fts_title = conn.execute(
        "SELECT h.number, h.title FROM hymn_fts hf JOIN hymns h ON hf.rowid = h.id WHERE hymn_fts MATCH '\"abide\"' ORDER BY rank LIMIT 5"
    ).fetchall()
    fts_first_line = conn.execute(
        "SELECT h.number, h.title FROM hymn_fts hf JOIN hymns h ON hf.rowid = h.id WHERE hymn_fts MATCH '\"comrades\"' ORDER BY rank LIMIT 5"
    ).fetchall()
    fts_lyrics = conn.execute(
        "SELECT h.number, h.title FROM hymn_fts hf JOIN hymns h ON hf.rowid = h.id WHERE hymn_fts MATCH '\"immanuel\"' ORDER BY rank LIMIT 5"
    ).fetchall()
    num_lookup = conn.execute("SELECT number, title FROM hymns WHERE number = 375").fetchone()

    if not fts_title or not fts_first_line or not fts_lyrics or not num_lookup:
        raise RuntimeError(f"Search verification failed: title={fts_title}, first={fts_first_line}, lyrics={fts_lyrics}, num375={num_lookup}")

    return {
        "integrity_check": integrity,
        "foreign_key_check": "0 errors",
        "counts": counts,
        "fts_samples": {
            "abide": fts_title,
            "comrades": fts_first_line,
            "immanuel": fts_lyrics,
            "number_375": num_lookup,
        },
    }


def main():
    with open(EXTRACTED_JSON, "r", encoding="utf-8") as f:
        hymns = json.load(f)

    source_sha = sha256_file(EXTRACTED_JSON)
    stats = build_staging_db(hymns, source_sha)

    # Atomic replace of TARGET_DB
    tmp_target = TARGET_DB + ".tmp"
    shutil.copy2(STAGING_DB, tmp_target)
    os.replace(tmp_target, TARGET_DB)

    # Sync DUPLICATE_DB if it exists
    dup_synced = False
    if os.path.exists(DUPLICATE_DB):
        tmp_dup = DUPLICATE_DB + ".tmp"
        shutil.copy2(STAGING_DB, tmp_dup)
        os.replace(tmp_dup, DUPLICATE_DB)
        dup_synced = True

    db_sha = sha256_file(TARGET_DB)
    db_size = os.path.getsize(TARGET_DB)

    print("Build succeeded!")
    print(f"Target DB: {TARGET_DB} ({db_size:,} bytes, sha256={db_sha})")
    print(f"Duplicate DB synced ({DUPLICATE_DB}): {dup_synced}")
    print("Stats:", json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
