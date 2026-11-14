import glob
import os
import re
import sys
import urllib.error
import urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('https://nat688.github.io/', 'https://fonts.', 'https://cdn.simpleicons.org', 'https://unpkg.com', 'https://gc.zgo.at', 'https://minecraft.wiki/images')
urls = {}
for path in glob.glob(os.path.join(ROOT, '*.html')) + [os.path.join(ROOT, '_layouts', 'default.html')]:
    with open(path, encoding='utf-8') as f:
        for u in re.findall(r'https?://[^\s"\'<>)]+', f.read()):
            u = u.rstrip('.,;')
            if '{' in u or u.startswith(SKIP):
                continue
            urls.setdefault(u.split('#')[0], os.path.basename(path))
bad = 0
for url, page in sorted(urls.items()):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (link check)'})
    try:
        code = urllib.request.urlopen(req, timeout=20).status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception as e:
        code = str(e)
    if code in (403, 429) or (isinstance(code, int) and code < 400):
        continue
    bad += 1
    print(f'::warning file={page}::{url} -> {code}')
print(f'{len(urls)} links checked, {bad} problem(s).')
sys.exit(0)
