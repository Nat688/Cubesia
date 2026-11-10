import json
import os
import sys
import requests
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def main():
    templates = [a for a in sys.argv[1:] if '{id}' in a]
    if not templates:
        sys.exit(__doc__)
    out = os.path.join(ROOT, 'images', 'items')
    os.makedirs(out, exist_ok=True)
    ids = sorted({p['id'].lower() for p in json.load(open(os.path.join(ROOT, '_data', 'prices.json'), encoding='utf-8'))})
    missing = []
    for n, i in enumerate(ids, 1):
        dest = os.path.join(out, i + '.png')
        if os.path.exists(dest):
            continue
        found = False
        for template in templates:
            try:
                r = requests.get(template.replace('{id}', i), timeout=15)
            except requests.RequestException:
                continue
            if r.ok and r.headers.get('content-type', '').startswith('image'):
                open(dest, 'wb').write(r.content)
                found = True
                break
        if not found:
            missing.append(i)
        if n % 100 == 0:
            print(n, '/', len(ids))
    print(f'{len(ids) - len(missing)} icons ok, {len(missing)} missing')
    if missing:
        print(', '.join(missing))
main()
