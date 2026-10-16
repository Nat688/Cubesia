import glob
import io
import os
import sys
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def convert(src, dst):
    im = Image.open(src)
    im.load()
    w, h = im.size
    lossless = io.BytesIO()
    im.save(lossless, 'WEBP', lossless=True, quality=100, method=6)
    strip = h < 200 or w / h > 4
    big = len(lossless.getvalue()) > 150 * 1024
    data = lossless
    if big and not strip:
        data = io.BytesIO()
        im.save(data, 'WEBP', quality=90, method=6)
    open(dst, 'wb').write(data.getvalue())
    return 'qualité 90' if data is not lossless else 'sans perte'
def main():
    delete = '--delete' in sys.argv
    pngs = sorted(glob.glob(os.path.join(ROOT, 'images', 'wiki', '*.png')))
    if not pngs:
        print('Aucun PNG à convertir dans images/wiki.')
        return
    for png in pngs:
        dst = png[:-4] + '.webp'
        if os.path.exists(dst):
            print(f'déjà converti : {os.path.basename(png)}')
        else:
            mode = convert(png, dst)
            print(f'{os.path.basename(png)}  {os.path.getsize(png) // 1024} Ko -> {os.path.getsize(dst) // 1024} Ko  ({mode})')
        if delete and os.path.exists(dst):
            os.remove(png)
if __name__ == '__main__':
    main()
