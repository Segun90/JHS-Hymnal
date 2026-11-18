"""Parse topical index to get hymn number to section mapping."""
from docx import Document
import re
from collections import defaultdict

doc = Document(r'c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\hymn_fixed.docx')
paras = doc.paragraphs

NUM_RE = re.compile(r'[.\u2026\t ]*(\d+)\s*$')

SECTION_MAP = {
    'TOPICAL INDEX ADMONITION': 'Admonition',
    'ADMONITION': 'Admonition',
    'ADORATION': 'Adoration',
    'ASSURANCE & CONFIDENCE': 'Assurance & Confidence',
    'BLOOD OF JESUS': 'Blood of Jesus',
    'CHRISTIAN LIFE': 'Christian Life',
    'CHRISTIAN SERVICE & REWARD': 'Christian Service & Reward',
    'CONFLICT AND VICTORY': 'Conflict & Victory',
    'CONFLICT & VICTORY': 'Conflict & Victory',
    'CHRIST OUR SAVIOUR': 'Christ Our Saviour',
    'COMMITMENT & CONSECRATION': 'Commitment & Consecration',
    'DIVINE HEALING': 'Divine Healing',
    'EVANGELISM': 'Evangelism',
    'GRACE & FORGIVENESS': 'Grace & Forgiveness',
    'HEAVEN': 'Heaven',
    'HOLY SPIRIT': 'Holy Spirit',
    'INVITATION': 'Invitation',
    'PRAYER': 'Prayer',
    'RAPTURE': 'Rapture',
    'SANCTIFICATION': 'Sanctification',
    'SPECIAL OCCASION': 'Special Occasion',
    "THE LORD S LOVE & CARE": "The Lord's Love & Care",
    "THE LORD'S LOVE & CARE": "The Lord's Love & Care",
    'WARNING JUDGMENT': 'Warning & Judgment',
    'SUPPLEMENTARY HYMN & SONGS': 'Supplementary Hymns & Songs',
    'SUPPLEMENTARY HYMNS & SONGS': 'Supplementary Hymns & Songs',
}

current_section = None
hymn_to_section = {}

for i, p in enumerate(paras):
    if i < 6223:
        continue
    text = p.text.strip()
    if not text:
        continue

    # Check if section heading
    tup = text.upper().replace('\u2019', ' ').replace("'", ' ')
    matched = None
    for k in SECTION_MAP:
        if tup.strip() == k or text.upper().strip() == k:
            matched = SECTION_MAP[k]
            break
    if matched:
        current_section = matched
        print(f'Section: {current_section!r} at para {i}')
        continue

    # Try to extract hymn number
    if current_section:
        m = NUM_RE.search(text)
        if m:
            num = int(m.group(1))
            if 1 <= num <= 500:
                if num not in hymn_to_section:
                    hymn_to_section[num] = current_section

sec_hymns = defaultdict(list)
for num, sec in sorted(hymn_to_section.items()):
    sec_hymns[sec].append(num)

print()
print('Section -> hymn numbers from index:')
sections_order = [
    'Admonition', 'Adoration', 'Assurance & Confidence', 'Blood of Jesus',
    'Christian Life', 'Christian Service & Reward', 'Christ Our Saviour',
    'Commitment & Consecration', 'Conflict & Victory', 'Divine Healing',
    'Evangelism', 'Grace & Forgiveness', 'Heaven', 'Holy Spirit', 'Invitation',
    'Prayer', 'Rapture', 'Sanctification', 'Special Occasion',
    "The Lord's Love & Care", 'Warning & Judgment', 'Supplementary Hymns & Songs'
]
for sec in sections_order:
    nums = sorted(sec_hymns.get(sec, []))
    if nums:
        print(f'  {sec}: {len(nums)} hymns, range #{min(nums)}-#{max(nums)}')
    else:
        print(f'  {sec}: NOT FOUND IN INDEX')

# Save mapping to file
import json
with open(r'c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\hymn_section_map.json', 'w') as f:
    json.dump(hymn_to_section, f, indent=2)
print('\nMapping saved to hymn_section_map.json')
