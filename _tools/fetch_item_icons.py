"""Downloads the item icons used by prices.html into images/items/ (so the site does not depend on a third party).

Usage, from the project root (needs internet and `pip install requests`):
    python _tools/fetch_item_icons.py "https://minecraft-api.vercel.app/images/items/{id}.png"
Then set  item_icon_url: "images/items/{id}.png"  in _config.yml.
{id} is the lowercase item id (e.g. diamond_sword). Items the source does not have are listed at the end.
"""
import json
import os
import sys
import requests
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def main():
    if len(sys.argv) != 2 or '{id}' not in sys.argv[1]:
        sys.exit(__doc__)
    template = sys.argv[1]
    out = os.path.join(ROOT, 'images', 'items')
    os.makedirs(out, exist_ok=True)
    ids = sorted({p['id'].lower() for p in json.load(open(os.path.join(ROOT, '_data', 'prices.json'), encoding='utf-8'))})
    missing = []
    for n, i in enumerate(ids, 1):
        dest = os.path.join(out, i + '.png')
        if os.path.exists(dest):
            continue
        try:
            r = requests.get(template.replace('{id}', i), timeout=15)
            if r.ok and r.headers.get('content-type', '').startswith('image'):
                open(dest, 'wb').write(r.content)
                continue
        except requests.RequestException:
            pass
        missing.append(i)
        if n % 100 == 0:
            print(n, '/', len(ids))
    print(f'{len(ids) - len(missing)} icons ok, {len(missing)} missing')
    if missing:
        print(', '.join(missing))
main()
