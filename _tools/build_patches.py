"""Single source for patches: patch.html  ->  _data.yml (the in-game changelog plugin).

Write your patches ONLY in patch.html (with data-date="YYYY-MM-DD" on every <details>).
This script builds the plugin file from it. It needs Python and PyYAML:  pip install pyyaml

Usage, from the project root:
    python _tools/build_patches.py --yaml path/to/the/server/_data.yml
        -> writes _build/_data.yml (put it back on the server)
    python _tools/build_patches.py
        -> same, but without the server file: every player will see every patch as unread

Options:
    --yaml FILE      the server's current _data.yml: its dates, author and "playersRead" list
                     are kept for every patch, texts are updated from patch.html and new
                     patches are added (unread by everyone)
    --only-new       leave the text of patches that are already in the server file untouched
    --out FILE       plugin file to write (default: _build/_data.yml)
    --feed FILE      also write an RSS feed (off by default), for example: --feed feed.xml
"""
import argparse
import copy
import datetime
import email.utils
import json
import os
import re
import sys
from html.parser import HTMLParser
from xml.sax.saxutils import escape
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://nat688.github.io/Cubesia/'
COLORS = {'new': 'dark_green', 'added': 'green', 'fixed': 'yellow', 'change': 'blue', 'removed': 'red'}
DEFAULT_AUTHOR = '"Nat_68"'
def slug(title):
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
class PatchParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.patches = []
        self.cur = None
        self.depth = 0
        self.in_summary = False
        self.li = None
        self.fmt = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'details':
            self.cur = {'title': '', 'date': a.get('data-date'), 'id': a.get('id'), 'items': []}
            self.patches.append(self.cur)
            self.depth = 0
        elif self.cur is None:
            return
        elif tag == 'summary':
            self.in_summary = True
        elif tag == 'ul':
            self.depth += 1
        elif tag == 'li':
            self.li = {'depth': self.depth, 'parts': []}
            self.fmt = []
        elif self.li is not None and tag in ('code', 'i', 'em', 'a', 'b', 'strong'):
            self.fmt.append((tag, a.get('href')))
    def handle_endtag(self, tag):
        if self.cur is None:
            return
        if tag == 'summary':
            self.in_summary = False
        elif tag == 'ul':
            self.depth -= 1
        elif tag == 'li' and self.li is not None:
            self.cur['items'].append(self.li)
            self.li = None
        elif tag == 'details':
            self.cur = None
        elif self.fmt and tag in ('code', 'i', 'em', 'a', 'b', 'strong'):
            self.fmt.pop()
    def handle_data(self, data):
        data = re.sub(r'[\u200b\u200c\u200d\ufeff]', '', data)
        if self.cur is None:
            return
        if self.in_summary:
            self.cur['title'] += data
        elif self.li is not None:
            kind, href = (self.fmt[-1] if self.fmt else (None, None))
            self.li['parts'].append({'kind': kind, 'text': data, 'href': href})
def read_patches(path):
    p = PatchParser()
    p.feed(open(path, encoding='utf-8').read())
    out = []
    for d in p.patches:
        d['title'] = d['title'].strip()
        d['id'] = d['id'] or slug(d['title'])
        out.append(d)
    return out
def split_tag(item):
    parts = [dict(x) for x in item['parts']]
    if item['depth'] == 1 and parts and parts[0]['kind'] is None:
        m = re.match(r'\s*(\w+)([\s\S]*)$', re.sub(r'\s+', ' ', parts[0]['text']))
        if m and m.group(1).lower() in COLORS:
            parts[0]['text'] = m.group(2)
            return m.group(1), parts
    return None, parts
def normalise(parts):
    toks = []
    for p in parts:
        kind = {'code': 'code', 'i': 'i', 'em': 'i'}.get(p['kind'])
        text = re.sub(r'\s+', ' ', p['text'])
        if toks and toks[-1][0] == kind and p['kind'] != 'a' and not toks[-1][2]:
            toks[-1][1] += text
        else:
            toks.append([kind, text, p['href']])
    toks = [t for t in toks if t[1] != '']
    if toks:
        toks[-1][1] = toks[-1][1].rstrip()
    return toks
def dumps(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
def minecraft_line(item):
    word, parts = split_tag(item)
    toks = normalise(parts)
    comps = []
    if word:
        comps.append({'color': COLORS[word.lower()], 'text': word})
    for kind, text, _ in toks:
        if kind == 'code':
            comps.append({'color': 'dark_gray', 'text': text})
        elif kind == 'i':
            comps.append({'italic': True, 'text': text})
        elif comps and isinstance(comps[-1], str):
            comps[-1] += text
        else:
            comps.append(text)
    if not comps:
        return None
    if not word and len(comps) == 1 and isinstance(comps[0], str):
        return dumps(comps[0].strip())
    return dumps({'extra': comps, 'text': ''})
def minecraft_lines(patch):
    lines = [dumps({'bold': True, 'text': patch['title']})]
    for item in patch['items']:
        line = minecraft_line(item)
        if line:
            lines.append(line)
    return lines
def build_yaml(patches, existing_path, only_new):
    import yaml
    existing = []
    if existing_path:
        loaded = yaml.safe_load(open(existing_path, encoding='utf-8')) or {}
        existing = loaded.get('entries') or []
    for e in existing:
        if isinstance(e.get('recordedAt'), datetime.datetime):
            e['recordedAt'] = e['recordedAt'].strftime('%Y-%m-%dT%H:%M:%SZ')
    def title_of(entry):
        try:
            return json.loads(entry['serializedLines'][0])['text']
        except Exception:
            return None
    by_title = {title_of(e): e for e in existing}
    author = existing[-1]['author'] if existing else DEFAULT_AUTHOR
    updated, added, warnings = 0, [], []
    new_entries = []
    for patch in reversed(patches):
        lines = minecraft_lines(patch)
        entry = by_title.get(patch['title'])
        if entry:
            if not only_new and entry['serializedLines'] != lines:
                entry['serializedLines'] = lines
                updated += 1
            if patch['date'] and not entry['recordedAt'].startswith(patch['date']):
                warnings.append(f'{patch["title"]} : date {patch["date"]} in patch.html, {entry["recordedAt"][:10]} in the server file (kept: date from the server file)')
        else:
            if not patch['date']:
                warnings.append(f'{patch["title"]} : no data-date, the current date is used')
            date = patch['date'] or datetime.date.today().isoformat()
            new_entries.append({'recordedAt': date + 'T00:00:00Z', 'author': author, 'playersRead': [], 'serializedLines': lines})
            added.append(patch['title'])
    entries = [copy.deepcopy(e) for e in existing] + sorted(new_entries, key=lambda e: e['recordedAt'])
    text = yaml.dump({'entries': entries}, default_flow_style=None, sort_keys=False, allow_unicode=True, width=80)
    return text, updated, added, warnings
def to_html(item):
    word, parts = split_tag(item)
    out = ''
    if word:
        out += f'<b>{escape(word)}</b>'
    for kind, text, href in normalise(parts):
        t = escape(text)
        if kind == 'code':
            t = f'<code>{t}</code>'
        elif kind == 'i':
            t = f'<i>{t}</i>'
        elif href:
            t = f'<a href="{escape(href)}">{t}</a>'
        out += t
    return out
def build_feed(patches):
    items = []
    for p in patches:
        link = f'{SITE}patch.html#{p["id"]}'
        date = datetime.datetime.strptime(p['date'], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc) if p['date'] else None
        body = '<ul>' + ''.join(
            '<li>' + ('&nbsp;&nbsp;&ndash; ' if i['depth'] > 1 else '') + to_html(i) + '</li>' for i in p['items']) + '</ul>'
        items.append(
            '\t\t<item>\n'
            f'\t\t\t<title>{escape(p["title"])}</title>\n'
            f'\t\t\t<link>{link}</link>\n'
            f'\t\t\t<guid isPermaLink="true">{link}</guid>\n'
            + (f'\t\t\t<pubDate>{email.utils.format_datetime(date)}</pubDate>\n' if date else '')
            + f'\t\t\t<description>{escape(body)}</description>\n'
            '\t\t</item>')
    newest = next((p['date'] for p in patches if p['date']), None)
    build = email.utils.format_datetime(datetime.datetime.strptime(newest, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)) if newest else ''
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n\t<channel>\n'
            '\t\t<title>Cubesia patches</title>\n'
            f'\t\t<link>{SITE}patch.html</link>\n'
            '\t\t<description>Patch notes of the Cubesia Minecraft server.</description>\n'
            '\t\t<language>en</language>\n'
            + (f'\t\t<lastBuildDate>{build}</lastBuildDate>\n' if build else '')
            + f'\t\t<atom:link href="{SITE}feed.xml" rel="self" type="application/rss+xml"/>\n'
            + '\n'.join(items) + '\n\t</channel>\n</rss>\n')
def main():
    ap = argparse.ArgumentParser(description='patch.html -> _data.yml (and an optional RSS feed)')
    ap.add_argument('--html', default=os.path.join(ROOT, 'patch.html'))
    ap.add_argument('--yaml')
    ap.add_argument('--only-new', action='store_true')
    ap.add_argument('--out', default=os.path.join(ROOT, '_build', '_data.yml'))
    ap.add_argument('--feed')
    a = ap.parse_args()
    patches = read_patches(a.html)
    if not patches:
        sys.exit('No patch found in ' + a.html)
    print(f'{len(patches)} patches read from patch.html (newest: {patches[0]["title"]})')
    try:
        text, updated, added, warnings = build_yaml(patches, a.yaml, a.only_new)
    except ImportError:
        sys.exit('PyYAML is missing: run  pip install pyyaml')
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, 'w', encoding='utf-8').write(text)
    print(f'plugin file: {a.out}  ({updated} patch(es) updated, {len(added)} new: {", ".join(added) or "none"})')
    for w in warnings:
        print('  warning:', w)
    if not a.yaml:
        print('  warning: without --yaml, every player will see every patch as unread')
    if a.feed:
        open(a.feed, 'w', encoding='utf-8').write(build_feed(patches))
        print('RSS feed:', a.feed)
if __name__ == '__main__':
    main()
