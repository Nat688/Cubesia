import json
import os
import sys
import requests
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USAGE = 'Usage: python _tools/fetch_item_icons.py "<url with {id} or {name}>" ["<other url>" ...]\n{id} = lowercase item id (diamond_sword), {name} = display name with underscores (Diamond_Sword). Each url is tried in order.\nThen set item_icon_url: "images/items/{id}.png" in _config.yml.'
def main():
    templates = [a for a in sys.argv[1:] if '{id}' in a or '{name}' in a]
    if not templates:
        sys.exit(USAGE)
    out = os.path.join(ROOT, 'images', 'items')
    os.makedirs(out, exist_ok=True)
    items = json.load(open(os.path.join(ROOT, '_data', 'prices.json'), encoding='utf-8'))
    names = {p['id'].lower(): p['name'].replace(' ', '_') for p in items}
    missing = []
    for n, i in enumerate(sorted(names), 1):
        dest = os.path.join(out, i + '.png')
        if os.path.exists(dest):
            continue
        found = False
        for template in templates:
            try:
                r = requests.get(template.replace('{id}', i).replace('{name}', names[i]), timeout=15)
            except requests.RequestException:
                continue
            if r.ok and r.headers.get('content-type', '').startswith('image'):
                open(dest, 'wb').write(r.content)
                found = True
                break
        if not found:
            missing.append(i)
        if n % 100 == 0:
            print(n, '/', len(names))
    print(f'{len(names) - len(missing)} icons ok, {len(missing)} missing')
    if missing:
        print(', '.join(missing))
main()
