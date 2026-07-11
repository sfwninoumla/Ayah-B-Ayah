"""One-time script: generates simple green crescent/book icons (no external deps)."""
import struct
import zlib
import math
import os

SIZES = [16, 32, 48, 128]
GREEN = (15, 118, 110, 255)  # #0f766e
WHITE = (243, 250, 246, 255)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")


SS = 4  # supersampling factor: render at SS*size, box-downsample for smooth edges


def render_big(size):
    big = size * SS
    pixels = [[GREEN for _ in range(big)] for _ in range(big)]
    cx, cy, r = big / 2, big / 2, big / 2

    # Circular background clip (outside circle -> transparent)
    for y in range(big):
        for x in range(big):
            if (x - cx + 0.5) ** 2 + (y - cy + 0.5) ** 2 > r * r:
                pixels[y][x] = (0, 0, 0, 0)

    # Simple crescent: white circle offset, subtracted by a green circle (creates crescent shape)
    moon_r = r * 0.62
    moon_cx, moon_cy = cx - r * 0.12, cy
    cut_r = r * 0.55
    cut_cx, cut_cy = cx + r * 0.22, cy - r * 0.05

    for y in range(big):
        for x in range(big):
            if pixels[y][x] == (0, 0, 0, 0):
                continue
            in_moon = (x - moon_cx + 0.5) ** 2 + (y - moon_cy + 0.5) ** 2 <= moon_r * moon_r
            in_cut = (x - cut_cx + 0.5) ** 2 + (y - cut_cy + 0.5) ** 2 <= cut_r * cut_r
            if in_moon and not in_cut:
                pixels[y][x] = WHITE

    return pixels


def make_icon(size):
    big = render_big(size)
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            r = g = b = a = 0
            for dy in range(SS):
                for dx in range(SS):
                    pr, pg, pb, pa = big[y * SS + dy][x * SS + dx]
                    # premultiply so transparent samples don't tint the edge
                    r += pr * pa
                    g += pg * pa
                    b += pb * pa
                    a += pa
            n = SS * SS
            if a == 0:
                row.append((0, 0, 0, 0))
            else:
                row.append((round(r / a), round(g / a), round(b / a), round(a / n)))
        pixels.append(row)
    return pixels


def write_png(path, pixels):
    size = len(pixels)
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # no filter
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


os.makedirs(OUT_DIR, exist_ok=True)
for size in SIZES:
    pixels = make_icon(size)
    write_png(os.path.join(OUT_DIR, f"icon{size}.png"), pixels)
    print(f"Wrote icon{size}.png")
