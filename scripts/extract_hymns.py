"""
extract_hymns_v2.py - Parse HYMN_JHS_ENGLISH_PRINT.docx and produce hymns_extracted.json
with proper section assignments using the topical index to fix missing section headings.

Key fixes:
- Assurance & Confidence (hymns 35-64) has no body heading; assigned from index
- Section sort orders use canonical list from brief
"""
import json, re, zipfile
from pathlib import Path
from docx import Document

DOCX_PATH  = r"c:\Users\Boanerges\Documents\SEGUN\COMPANY FILES\MY PUBLICATIONS\JHS HYMN ENGLISH\PDF FILES\HYMN_JHS_ENGLISH_PRINT.docx"
FIXED_DOCX = r"c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\hymn_fixed.docx"
OUT_JSON   = r"c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\hymns_extracted.json"
OUT_REPORT = r"c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\extraction_report.txt"

INDEX_STOP_PARA = 6223   # topical index starts here

# Canonical section sort orders
SECTION_SORT = {
    "Admonition": 1,
    "Adoration": 2,
    "Assurance & Confidence": 3,
    "Blood of Jesus": 4,
    "Christian Life": 5,
    "Christian Service & Reward": 6,
    "Christ Our Saviour": 7,
    "Commitment & Consecration": 8,
    "Conflict & Victory": 9,
    "Divine Healing": 10,
    "Evangelism": 11,
    "Grace & Forgiveness": 12,
    "Heaven": 13,
    "Holy Spirit": 14,
    "Invitation": 15,
    "Prayer": 16,
    "Rapture": 17,
    "Sanctification": 18,
    "Special Occasion": 19,
    "The Lord's Love & Care": 20,
    "Warning & Judgment": 21,
    "Supplementary Hymns & Songs": 22,
    "Unknown": 99,
}

# Section canonicalization lookup (lowercase key -> canonical name)
SECTION_CANON = {
    "admonition":                     "Admonition",
    "adoration":                      "Adoration",
    "assurance & confidence":         "Assurance & Confidence",
    "assurance and confidence":       "Assurance & Confidence",
    "blood of jesus":                 "Blood of Jesus",
    "christian life":                 "Christian Life",
    "christian service/reward":       "Christian Service & Reward",
    "christian service & reward":     "Christian Service & Reward",
    "christian service and reward":   "Christian Service & Reward",
    "christ our saviour":             "Christ Our Saviour",
    "christ our savior":              "Christ Our Saviour",
    "commitment & consecration":      "Commitment & Consecration",
    "commitment and consecration":    "Commitment & Consecration",
    "conflict & victory":             "Conflict & Victory",
    "conflict and victory":           "Conflict & Victory",
    "divine healing":                 "Divine Healing",
    "divine healer":                  "Divine Healing",
    "evangelism":                     "Evangelism",
    "grace and forgiveness":          "Grace & Forgiveness",
    "grace & forgiveness":            "Grace & Forgiveness",
    "heaven":                         "Heaven",
    "holy spirit":                    "Holy Spirit",
    "invitation":                     "Invitation",
    "prayer":                         "Prayer",
    "rapture":                        "Rapture",
    "sanctification":                 "Sanctification",
    "special occasion":               "Special Occasion",
    "the lord's love & care":         "The Lord's Love & Care",
    "the lord's love and care":       "The Lord's Love & Care",
    "warning judgment":               "Warning & Judgment",
    "warning & judgment":             "Warning & Judgment",
    "warning and judgment":           "Warning & Judgment",
    "supplementary hymns & songs":    "Supplementary Hymns & Songs",
    "supplementary hymns and songs":  "Supplementary Hymns & Songs",
    # sub-sections that roll up to Supplementary
    "resurrection":                   "Supplementary Hymns & Songs",
    "word of god":                    "Supplementary Hymns & Songs",
}

STANZA_NUM_RE      = re.compile(r'^\s*(\d+)\.\s+(.+)$', re.DOTALL)
STANZA_NUM_ONLY_RE = re.compile(r'^\s*(\d+)\.\s*$')
CHORUS_RE          = re.compile(r'^\s*(CHORUS|REFRAIN|chorus|refrain|Chorus|Refrain):?\s*$')


def fix_docx(src: str, dst: str):
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    if Path(dst).exists():
        print(f"Fixed DOCX exists: {dst}")
        return
    with zipfile.ZipFile(src, 'r') as zin:
        with zipfile.ZipFile(dst, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if 'media' in item.filename:
                    zout.writestr(item, b'')
                    continue
                try:
                    data = zin.read(item.filename)
                    zout.writestr(item, data)
                except Exception as e:
                    print(f"  Skip corrupt {item.filename}: {e}")
    print(f"Fixed DOCX written: {dst}")


def parse_index_section_map(paras):
    """Parse the topical index (starting at INDEX_STOP_PARA) to build hymn# -> section map."""
    NUM_RE = re.compile(r'[.\u2026\t ]*(\d+)\s*$')

    # Index section headings (body text bold or Heading 1 ALL CAPS)
    INDEX_SECTION_MAP = {
        'TOPICAL INDEX ADMONITION':   'Admonition',
        'ADMONITION':                 'Admonition',
        'ADORATION':                  'Adoration',
        'ASSURANCE & CONFIDENCE':     'Assurance & Confidence',
        'BLOOD OF JESUS':             'Blood of Jesus',
        'CHRISTIAN LIFE':             'Christian Life',
        'CHRISTIAN SERVICE & REWARD': 'Christian Service & Reward',
        'CONFLICT AND VICTORY':       'Conflict & Victory',
        'CONFLICT & VICTORY':         'Conflict & Victory',
        'CHRIST OUR SAVIOUR':         'Christ Our Saviour',
        'COMMITMENT & CONSECRATION':  'Commitment & Consecration',
        'DIVINE HEALING':             'Divine Healing',
        'EVANGELISM':                 'Evangelism',
        'GRACE & FORGIVENESS':        'Grace & Forgiveness',
        'HEAVEN':                     'Heaven',
        'HOLY SPIRIT':                'Holy Spirit',
        'INVITATION':                 'Invitation',
        'PRAYER':                     'Prayer',
        'RAPTURE':                    'Rapture',
        'SANCTIFICATION':             'Sanctification',
        'SPECIAL OCCASION':           'Special Occasion',
        "THE LORD'S LOVE AND CARE":   "The Lord's Love & Care",
        "THE LORD'S LOVE & CARE":     "The Lord's Love & Care",
        'THE LORD S LOVE AND CARE':   "The Lord's Love & Care",
        'THE LORD S LOVE & CARE':     "The Lord's Love & Care",
        'WARNING JUDGMENT':           'Warning & Judgment',
        'SUPPLEMENTARY HYMN & SONGS': 'Supplementary Hymns & Songs',
        'SUPPLEMENTARY HYMNS & SONGS':'Supplementary Hymns & Songs',
    }

    current_sec = None
    hymn_to_sec = {}

    for i, p in enumerate(paras):
        if i < INDEX_STOP_PARA:
            continue
        text = p.text.strip()
        if not text:
            continue

        # Normalize for lookup
        norm = text.upper().replace('\u2019', "'").strip()
        sec = INDEX_SECTION_MAP.get(norm)
        if sec:
            current_sec = sec
            continue

        # Also handle bold Body Text section markers
        is_bold = any(r.bold for r in p.runs if r.text.strip())
        if is_bold and p.style.name == 'Body Text' and not NUM_RE.search(text):
            sec2 = INDEX_SECTION_MAP.get(norm)
            if sec2:
                current_sec = sec2
                continue

        if current_sec:
            m = NUM_RE.search(text)
            if m:
                num = int(m.group(1))
                if 1 <= num <= 600 and num not in hymn_to_sec:
                    hymn_to_sec[num] = current_sec

    return hymn_to_sec


def is_section_heading(text, style, is_bold):
    """Return canonical section name or None."""
    if not text:
        return None
    key = text.strip().lower()

    if style == 'Heading 1' and not text.strip().isupper() and key in SECTION_CANON:
        return SECTION_CANON[key]

    if style == 'Body Text' and is_bold and key in SECTION_CANON:
        return SECTION_CANON[key]

    return None


def is_hymn_title(text, style, is_bold):
    """Return True if paragraph is a hymn title."""
    text = text.strip()
    if not text:
        return False

    if style == 'Heading 1':
        # Exclude known section names and index headings
        if text.lower() in SECTION_CANON:
            return False
        if 'TOPICAL INDEX' in text.upper() or 'GENERAL INDEX' in text.upper():
            return False
        # Must start with capital letter
        if re.match(r'^[A-Z\'\"]', text):
            return True

    if style == 'List Paragraph' and is_bold:
        return True

    return False


def parse_stanza_number(text):
    """If text starts 'N. rest', return (N, rest). Else None."""
    m = STANZA_NUM_RE.match(text)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None


def parse_docx(path: str, index_map: dict):
    doc = Document(path)
    paras = doc.paragraphs
    total = len(paras)
    print(f"Total paragraphs: {total}")

    hymns = []
    errors = []

    current_section = "Unknown"
    current_hymn = None
    stanza_lines = []
    stanza_italic_flags = []
    stanza_explicit_chorus = False
    stanza_explicit_verse_num = None
    verse_counter = 0
    hymn_counter = 0
    first_content_seen = False

    def flush_stanza():
        nonlocal stanza_lines, stanza_italic_flags, stanza_explicit_chorus, stanza_explicit_verse_num, verse_counter
        if current_hymn is None or not stanza_lines:
            stanza_lines = []
            stanza_italic_flags = []
            stanza_explicit_chorus = False
            stanza_explicit_verse_num = None
            return
        text = '\n'.join(line for line in stanza_lines if line).strip()
        if text:
            # Determine if this stanza is a chorus:
            # Explicit CHORUS/REFRAIN marker OR majority of lines are italicized
            italic_count = sum(1 for f in stanza_italic_flags if f)
            is_chorus = stanza_explicit_chorus or (len(stanza_italic_flags) > 0 and italic_count * 2 >= len(stanza_italic_flags) and italic_count > 0)
            if is_chorus:
                stype = 'chorus'
                snum = 0
            else:
                stype = 'verse'
                if stanza_explicit_verse_num is not None:
                    verse_counter = stanza_explicit_verse_num
                else:
                    verse_counter += 1
                snum = verse_counter
            current_hymn['stanzas'].append({
                'type': stype,
                'number': snum,
                'text': text,
            })
        stanza_lines = []
        stanza_italic_flags = []
        stanza_explicit_chorus = False
        stanza_explicit_verse_num = None

    def flush_hymn():
        nonlocal current_hymn
        if current_hymn is not None:
            # Set first_line from first verse stanza
            if not current_hymn['first_line']:
                for st in current_hymn['stanzas']:
                    if st['type'] == 'verse' and st['text']:
                        first = st['text'].split('\n')[0].strip()
                        current_hymn['first_line'] = first
                        break
            if not current_hymn['first_line'] and current_hymn['stanzas']:
                current_hymn['first_line'] = current_hymn['stanzas'][0]['text'].split('\n')[0].strip()
            if current_hymn['title']:
                hymns.append(current_hymn)
        current_hymn = None

    def start_hymn(title: str, sec: str):
        nonlocal current_hymn, stanza_lines, stanza_italic_flags, stanza_explicit_chorus, stanza_explicit_verse_num, verse_counter, hymn_counter, first_content_seen
        flush_stanza()
        flush_hymn()
        hymn_counter += 1
        canon_sec = SECTION_CANON.get(sec.strip().lower(), sec.strip())
        current_hymn = {
            'number': hymn_counter,
            'title': title.strip().upper(),
            'first_line': None,
            'section': canon_sec,
            'section_sort_order': SECTION_SORT.get(canon_sec, 99),
            'stanzas': [],
        }
        stanza_lines = []
        stanza_italic_flags = []
        stanza_explicit_chorus = False
        stanza_explicit_verse_num = None
        verse_counter = 0
        first_content_seen = False

    for idx, para in enumerate(paras):
        if idx >= INDEX_STOP_PARA:
            break

        style = para.style.name
        raw = para.text
        text = raw.strip()
        non_empty_runs = [r for r in para.runs if r.text.strip()]
        is_bold = any(r.bold for r in non_empty_runs)
        is_italic = bool(non_empty_runs) and all(r.italic for r in non_empty_runs)

        # 1. Section heading
        sec = is_section_heading(text, style, is_bold)
        if sec:
            flush_stanza()
            flush_hymn()
            current_section = sec
            first_content_seen = False
            continue

        # 2. Hymn title
        if is_hymn_title(text, style, is_bold):
            # Handle split titles (two consecutive Heading 1 lines, no content between)
            if (current_hymn is not None
                    and not current_hymn['stanzas']
                    and not stanza_lines
                    and style == 'Heading 1'
                    and not first_content_seen):
                current_hymn['title'] = (current_hymn['title'] + ' ' + text.upper()).strip()
                continue
            start_hymn(text, current_section)
            continue

        # 3. Blank line -> stanza boundary
        if not text:
            if stanza_lines:
                flush_stanza()
            continue

        # 4. Skip toc entries
        if style == 'toc 1':
            continue

        # 5. No current hymn - skip
        if current_hymn is None:
            continue

        # 6. Chorus/refrain marker
        if CHORUS_RE.match(text):
            flush_stanza()
            stanza_explicit_chorus = True
            continue

        # 7. Stanza number only: "2." "3."
        sn_only = STANZA_NUM_ONLY_RE.match(text)
        if sn_only:
            flush_stanza()
            stanza_explicit_verse_num = int(sn_only.group(1))
            continue

        # 8. Stanza number + text: "1. ..." "2. Some text..."
        sn = parse_stanza_number(text)
        if sn:
            n_val, rest = sn
            if n_val >= 2 or not stanza_lines:
                if stanza_lines:
                    flush_stanza()
                stanza_explicit_verse_num = n_val
                stanza_lines.append(rest)
                stanza_italic_flags.append(is_italic)
                first_content_seen = True
                continue

        # 9. Regular content line: if italic status flips mid-block (without blank line), split stanza
        if stanza_lines:
            prev_italic = stanza_italic_flags[-1]
            if is_italic != prev_italic:
                flush_stanza()

        stanza_lines.append(text)
        stanza_italic_flags.append(is_italic)
        first_content_seen = True

    # Flush last
    flush_stanza()
    flush_hymn()

    # Post-process: fix section assignments using the index map
    # The index covers hymns 1-325; use it to override where the body was ambiguous
    # Only override Adoration -> Assurance & Confidence (the main missing section)
    fixed_count = 0
    for h in hymns:
        num = h['number']
        if num in index_map:
            idx_sec = index_map[num]
            # Only apply index correction for the known ambiguous range (Adoration vs Assurance)
            if h['section'] == 'Adoration' and idx_sec == 'Assurance & Confidence':
                h['section'] = 'Assurance & Confidence'
                h['section_sort_order'] = SECTION_SORT['Assurance & Confidence']
                fixed_count += 1

    print(f"Section fixes applied (Adoration->Assurance & Confidence): {fixed_count}")
    return hymns, errors


def validate(hymns, errors):
    report_lines = []
    seen_nums = {}
    seen_titles = {}
    no_title = []
    no_stanzas = []
    sections = {}
    verse_count = 0
    chorus_count = 0

    for h in hymns:
        n = h['number']
        t = h['title']
        s = h['section']

        if n in seen_nums:
            errors.append(f"Duplicate hymn number: {n} (titles: {seen_nums[n]!r} and {t!r})")
        seen_nums[n] = t

        tl = t.lower()
        if tl in seen_titles:
            errors.append(f"Duplicate title: {t!r} (numbers {seen_titles[tl]} and {n})")
        seen_titles[tl] = n

        if not t:
            no_title.append(n)
        if not h['stanzas']:
            no_stanzas.append(n)

        for st in h['stanzas']:
            if st['type'] == 'verse':
                verse_count += 1
            else:
                chorus_count += 1

        sections.setdefault(s, []).append(n)

    nums = sorted(seen_nums.keys())
    gaps = [x for x in range(1, max(nums) + 1) if x not in seen_nums] if nums else []

    report_lines.append("=== JHS HYMNAL EXTRACTION REPORT ===")
    report_lines.append("Source: HYMN_JHS_ENGLISH_PRINT.docx")
    report_lines.append(f"Total hymns extracted: {len(hymns)}")
    report_lines.append(f"Number range: {min(nums) if nums else '?'} - {max(nums) if nums else '?'}")
    report_lines.append(f"Total stanzas: {verse_count + chorus_count} (verses={verse_count}, choruses={chorus_count})")
    report_lines.append(f"Sections found ({len(sections)}):")
    for sec_name in sorted(sections.keys(), key=lambda s: SECTION_SORT.get(s, 99)):
        hnums = sections[sec_name]
        report_lines.append(f"  {sec_name}: {len(hnums)} hymns (#{min(hnums)}-#{max(hnums)})")
    report_lines.append(f"Duplicate numbers: {len([e for e in errors if 'Duplicate hymn number' in e])}")
    report_lines.append(f"Duplicate titles: {len([e for e in errors if 'Duplicate title' in e])}")
    report_lines.append(f"Missing titles: {no_title}")
    report_lines.append(f"No stanzas: {no_stanzas[:30]}{'...' if len(no_stanzas) > 30 else ''}")
    report_lines.append(f"Number gaps: {gaps}")
    report_lines.append("All errors/warnings:")
    for e in errors:
        report_lines.append(f"  - {e}")
    if not errors:
        report_lines.append("  (none)")

    return '\n'.join(report_lines)


def main():
    Path(OUT_JSON).parent.mkdir(parents=True, exist_ok=True)

    print(f"Fixing corrupt DOCX...")
    fix_docx(DOCX_PATH, FIXED_DOCX)

    print(f"Parsing: {FIXED_DOCX}")
    doc_for_index = Document(FIXED_DOCX)
    index_map = parse_index_section_map(doc_for_index.paragraphs)
    print(f"Index map: {len(index_map)} hymns mapped ({min(int(k) for k in index_map)}-{max(int(k) for k in index_map)})")

    hymns, errors = parse_docx(FIXED_DOCX, index_map)
    print(f"Extracted {len(hymns)} hymns")

    report = validate(hymns, errors)
    print(report)

    Path(OUT_JSON).write_text(json.dumps(hymns, indent=2, ensure_ascii=False), encoding='utf-8')
    Path(OUT_REPORT).write_text(report, encoding='utf-8')
    print(f"\nJSON written to: {OUT_JSON}")
    print(f"Report written to: {OUT_REPORT}")

    if hymns:
        print("\n--- First 5 hymns ---")
        for h in hymns[:5]:
            print(f"  #{h['number']}: {h['title']!r} | section={h['section']!r} | stanzas={len(h['stanzas'])}")
            for st in h['stanzas'][:2]:
                print(f"    [{st['type']} {st['number']}]: {st['text'][:60]!r}")
        print("--- Last 3 hymns ---")
        for h in hymns[-3:]:
            print(f"  #{h['number']}: {h['title']!r} | section={h['section']!r} | stanzas={len(h['stanzas'])}")
            for st in h['stanzas'][:1]:
                print(f"    [{st['type']} {st['number']}]: {st['text'][:60]!r}")


if __name__ == '__main__':
    main()
