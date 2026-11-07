"""Builds _data/prices.json (used by prices.html) from the server's worth.yml.

Usage (from the project root):   python _tools/build_prices.py path/to/worth.yml
Accepts the SKSell prices.yml (categories: <key>: {display-name, items: {ITEM: price}}),
a flat file (ITEM: price) or one with sections (section: {ITEM: price}).
Keys that are not plain numbers (bonus settings, etc.) are ignored.
"""
import json
import os
import sys
import yaml
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IGNORE = {'flat-enchantment-bonus', 'multiplier-enchantment-bonus'}
def is_price(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)
def walk(node, section, out):
    for key, value in node.items():
        if str(key).lower() in IGNORE:
            continue
        if is_price(value):
            out.append({'id': str(key), 'name': str(key).replace('_', ' ').title(), 'section': section, 'price': value})
        elif isinstance(value, dict):
            walk(value, str(key).replace('_', ' ').title() if not section else section, out)
def main():
    if len(sys.argv) != 2:
        sys.exit('Usage: python _tools/build_prices.py path/to/worth.yml')
    with open(sys.argv[1], encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}
    if isinstance(data.get('worth'), dict):
        data = data['worth']
    out = []
    if isinstance(data.get('categories'), dict):
        for cat in data['categories'].values():
            label = str(cat.get('display-name', '')).title().replace('&', '&')
            for key, value in (cat.get('items') or {}).items():
                if is_price(value) and value > 0:
                    out.append({'id': str(key), 'name': str(key).replace('_', ' ').title(), 'section': label, 'price': value})
    else:
        walk(data, '', out)
    out.sort(key=lambda r: r['name'])
    path = os.path.join(ROOT, '_data', 'prices.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print(f'{len(out)} prices written to {os.path.relpath(path, ROOT)}')
main()
