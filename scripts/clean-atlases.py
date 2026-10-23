"""Remove connected matte contamination without repainting character RGB.

Explicitly authorized pixel cleanup. Requires Pillow and NumPy. Input is a
directory containing core.png, daily.png, activity.png, scenes.png; output must
be different so repeated trials cannot erode an already cleaned silhouette.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter


def components(mask):
    seen = np.zeros(mask.shape, dtype=bool)
    h, w = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        q = [(y, x)]
        seen[y, x] = True
        for yy, xx in q:
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = yy + dy, xx + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        yield q


def clean(im):
    a = np.array(im.convert('RGBA'))
    rgb = a[:, :, :3].astype(np.int16)
    low, high = rgb.min(2), rgb.max(2)
    # Flat neutral white/grey is the leftover matte, not the lavender artwork.
    neutral = ((high - low) <= 1) & (high >= 115)
    # Clipped saturated key colours do not belong to this artwork's palette.
    middle = np.sort(rgb, axis=2)[:, :, 1]
    neon = (high > 245) & (low < 10) & ((middle < 15) | (middle > 240))
    candidate = neutral | neon | (a[:, :, 3] < 16)
    # Only flood from transparent background; internal white fabric stays intact.
    seed = a[:, :, 3] < 16
    flood = seed.copy()
    # Vectorised dilation, constrained to connected matte regions (also holes).
    while True:
        grown = np.array(Image.fromarray(flood.astype('uint8') * 255).filter(ImageFilter.MaxFilter(3))) > 0
        new = grown & candidate
        if np.all((flood | new) == flood):
            break
        flood |= new
    mask = (a[:, :, 3] >= 16) & ~flood
    # Remove detached fragments; intentional large props (orb/sun) remain.
    for component in components(mask):
        if len(component) < 80:
            yy, xx = zip(*component)
            mask[yy, xx] = False
    # Median removes single-pixel fringe spikes. Feather only within silhouette.
    m = Image.fromarray(mask.astype('uint8') * 255).filter(ImageFilter.MedianFilter(3))
    alpha = np.minimum(np.array(m.filter(ImageFilter.GaussianBlur(.45))), np.array(m))
    a[:, :, 3] = np.minimum(a[:, :, 3], alpha)
    for component in components(a[:, :, 3] > 0):
        if len(component) < 20:
            yy, xx = zip(*component)
            a[yy, xx, 3] = 0
    a[a[:, :, 3] == 0, :3] = 0
    before = np.array(im.convert('RGBA'))
    visible = a[:, :, 3] > 0
    assert np.array_equal(a[:, :, :3][visible], before[:, :, :3][visible])
    return Image.fromarray(a), {
        'removedPixels': int(((before[:, :, 3] > 0) & (a[:, :, 3] == 0)).sum()),
        'opaquePixels': int((a[:, :, 3] >= 250).sum()),
        'interiorRgbUnchanged': True,
        'remainingComponents': sorted((len(c) for c in components(a[:, :, 3] > 16)), reverse=True),
    }


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    assert args.source.resolve() != args.output.resolve()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {}
    for name in ('core', 'daily', 'activity', 'scenes'):
        im, report[name] = clean(Image.open(args.source / (name + '.png')))
        im.save(args.output / (name + '.png'), optimize=True)
    (args.output / 'cleanup-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))

