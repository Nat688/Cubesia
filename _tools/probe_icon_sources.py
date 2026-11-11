import sys
import requests
SAMPLES = [('diamond_sword', 'Diamond_Sword'), ('acacia_fence', 'Acacia_Fence'), ('stone_stairs', 'Stone_Stairs'), ('oak_log', 'Oak_Log'), ('apple', 'Apple'), ('bamboo_fence_gate', 'Bamboo_Fence_Gate'), ('netherite_ingot', 'Netherite_Ingot'), ('furnace', 'Furnace'), ('diamond_block', 'Block_of_Diamond'), ('grass_block', 'Grass_Block')]
CANDIDATES = [
    'https://minecraft.wiki/w/Special:FilePath/Invicon_{name}.png',
    'https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/1.21.1/items/{id}.png',
    'https://cdn.jsdelivr.net/gh/PrismarineJS/minecraft-assets@master/data/1.21.1/blocks/{id}.png',
    'https://mc.nerothe.com/img/1.21.1/minecraft_{id}.png',
    'https://minecraft-api.vercel.app/images/items/{id}.png',
    'https://minecraft-api.vercel.app/images/blocks/{id}.png',
]
def ok(url):
    try:
        r = requests.get(url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
        return r.ok and r.headers.get('content-type', '').startswith('image')
    except requests.RequestException:
        return False
templates = [a for a in sys.argv[1:] if '{id}' in a or '{name}' in a] or CANDIDATES
for t in templates:
    hits = [i for i, n in SAMPLES if ok(t.replace('{id}', i).replace('{name}', n))]
    print(f'{len(hits)}/{len(SAMPLES)}  {t}')
    if hits and len(hits) < len(SAMPLES):
        print('   missing:', ', '.join(i for i, n in SAMPLES if i not in hits))
