import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = 'https://nat688.github.io/Cubesia/'
SKIP_DIRS = {'.git', '.github', '_site', 'node_modules', '_tools'}
BIG_IMAGE = 500 * 1024
ON_GITHUB = bool(os.environ.get('GITHUB_ACTIONS'))
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []
    def handle_starttag(self, tag, attrs):
        line = self.getpos()[0]
        a = dict(attrs)
        if a.get('id'):
            self.ids.append((a['id'], line))
        for attr in ('src', 'href', 'poster'):
            v = a.get(attr)
            if v and not v.startswith('data:'):
                if tag == 'link' and attr == 'href' and a.get('rel') in ('canonical', 'preconnect'):
                    continue
                self.refs.append((attr, v.strip(), line, tag))
def parse(path):
    text = open(path, encoding='utf-8').read()
    m = re.match(r'---\n.*?\n---\n', text, re.S)
    if m:
        text = '\n' * m.group(0).count('\n') + text[m.end():]
    p = Page()
    p.feed(text)
    return p
def html_files():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            if f.endswith('.html'):
                yield os.path.join(base, f)
def main():
    pages = {os.path.relpath(f, ROOT).replace(os.sep, '/'): parse(f) for f in html_files()}
    errors, warnings = [], []
    def err(file, line, msg):
        errors.append((file, line, msg))
    def target_file(rel):
        rel = unquote(rel)
        if rel == '' or rel.endswith('/'):
            rel += 'index.html'
        for cand in (rel, rel + '.html'):
            if os.path.isfile(os.path.join(ROOT, cand)):
                return cand
        return None
    for name, page in pages.items():
        seen = {}
        for i, line in page.ids:
            if '{{' in i or '{%' in i:
                continue
            if i in seen:
                err(name, line, f'id en double : "{i}" (déjà utilisé ligne {seen[i]})')
            else:
                seen[i] = line
        for attr, v, line, tag in page.refs:
            if '{{' in v or '{%' in v or v.startswith(('mailto:', 'tel:', 'javascript:')):
                continue
            if v.startswith(('http://', 'https://', '//')):
                if not v.startswith(SITE_URL):
                    continue
                v = v[len(SITE_URL):]
            path, _, frag = v.partition('#')
            path = path.split('?')[0]
            if path == '':
                dest = name
            else:
                dest = target_file(path)
                if dest is None:
                    kind = 'image' if re.search(r'\.(png|jpe?g|gif|webp|svg|ico)$', path, re.I) else 'fichier'
                    err(name, line, f'{kind} introuvable : {path}')
                    continue
            if frag and frag != 'top' and dest.endswith('.html'):
                ids = {i for i, _ in pages[dest].ids} if dest in pages else set()
                if frag not in ids:
                    err(name, line, f'lien # cassé : "#{frag}" n\'existe pas dans {dest}')
            if dest and tag == 'img':
                size = os.path.getsize(os.path.join(ROOT, dest))
                if size > BIG_IMAGE:
                    warnings.append((name, line, f'image lourde ({size // 1024} Ko) : {dest}'))
    def show(level, items):
        for f, l, m in sorted(set(items)):
            if ON_GITHUB:
                print(f'::{level} file={f},line={l}::{m}')
            else:
                print(f'{level.upper():7} {f}:{l}  {m}')
    show('warning', warnings)
    show('error', errors)
    print(f'\n{len(pages)} pages vérifiées : {len(errors)} erreur(s), {len(warnings)} avertissement(s).')
    return 1 if errors else 0
if __name__ == '__main__':
    sys.exit(main())
