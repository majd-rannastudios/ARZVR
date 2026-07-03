"""
Remove white background from evo360-logo.png first variant.
Saves public/evo360-duck.png with transparency.
"""
from PIL import Image
import sys, os

src = os.path.join(os.path.dirname(__file__), '..', 'public', 'evo360-logo.png')
dst = os.path.join(os.path.dirname(__file__), '..', 'public', 'evo360-duck.png')

img = Image.open(src).convert('RGBA')
w, h = img.size
print(f'Original: {w}x{h}')

# First variant occupies top ~23.5% of the 4-variant sheet
first_h = int(h * 0.235)
variant = img.crop((0, 0, w, first_h))
print(f'First variant: {w}x{first_h}')

px = variant.load()
THRESHOLD = 235  # pixels with r,g,b all above this become transparent

for y in range(first_h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
            px[x, y] = (r, g, b, 0)

# Trim transparent border to find tight bounding box of the duck
bbox = variant.getbbox()
print(f'Bounding box: {bbox}')
trimmed = variant.crop(bbox) if bbox else variant

trimmed.save(dst, 'PNG')
print(f'Saved: {dst}  ({trimmed.size[0]}x{trimmed.size[1]})')
