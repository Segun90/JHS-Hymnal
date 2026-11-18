import json
with open(r'c:\Users\Boanerges\Documents\JHS HYMNAL\jhs-bible-hymnal\scripts\hymns_extracted.json') as f:
    hymns = json.load(f)
for h in hymns[29:70]:
    print(f"#{h['number']}: {h['title']!r} | section={h['section']!r}")
