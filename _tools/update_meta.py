import datetime
import os
import re
import subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://nat688.github.io/Cubesia/'
PAGES = ['index.html', 'wiki.html', 'patch.html', 'rules.html', 'vote.html', 'map.html', 'staff.html', 'prices.html', 'apply.html']
def last_change(rel):
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', rel], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        if out:
            return out
    except OSError:
        pass
    return datetime.date.fromtimestamp(os.path.getmtime(os.path.join(ROOT, rel))).isoformat()
def build_sitemap():
    rows = []
    for rel in PAGES:
        if not os.path.isfile(os.path.join(ROOT, rel)):
            continue
        loc = SITE if rel == 'index.html' else SITE + rel
        rows.append(f'\t<url><loc>{loc}</loc><lastmod>{last_change(rel)}</lastmod></url>')
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(rows) + '\n</urlset>\n'
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(xml)
def stamp_rules():
    path = os.path.join(ROOT, 'rules.html')
    with open(path, encoding='utf-8') as f:
        text = f.read()
    today = last_change('rules.html')
    new = re.sub(r'^updated: .*$', f'updated: {today}', text, count=1, flags=re.M)
    if new != text:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
if __name__ == '__main__':
    stamp_rules()
    build_sitemap()
