#!/usr/bin/env python3
"""Makes a smaller .webp copy of each site image. Your .png files are never changed.
Run from the va_portfolio folder (re-run after replacing a PNG):
    pip3 install pillow
    python3 optimize-images.py
"""
from pathlib import Path
from PIL import Image

JOBS = {  # name: (max width, max height, quality)
    "hero-photo": (800, 1000, 84),
    "typing-test": (1200, 750, 80),
    "scraper-output": (1200, 750, 80),
}
folder = Path(__file__).resolve().parent / "assets"

for name, (w, h, q) in JOBS.items():
    src = folder / f"{name}.png"
    if not src.exists():
        print(f"skip  {name}.png (not found)")
        continue
    img = Image.open(src)
    alpha = img.mode in ("RGBA", "LA") or "transparency" in img.info
    img = img.convert("RGBA" if alpha else "RGB")
    img.thumbnail((w, h), Image.LANCZOS)          # only shrinks, keeps proportions
    out = src.with_suffix(".webp")
    img.save(out, "WEBP", quality=q, method=6, alpha_quality=90)
    print(f"ok    {name}: {src.stat().st_size // 1024} KB png -> {out.stat().st_size // 1024} KB webp")
