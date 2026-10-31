#!/usr/bin/env python3
"""tile_list(이름 x y w h) -> atlas.json 변환기.

사용법:  python3 tools/build_atlas.py
새 스프라이트시트를 추가하면 이 스크립트에 SOURCES 항목을 추가하세요.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = [
    # (tile_list 경로, 이미지 키)  — 이미지 키는 src/core/assets.js 의 IMAGES 와 일치해야 함
    ("assets/sprites/tile_list_v1.7.txt", "dungeon"),
]
# 원본 tile_list 의 오타 수정 (원본 파일은 건드리지 않음)
FIXES = {"zombie_anim_f10": "zombie_anim_f0"}

frames = {}
for path, image in SOURCES:
    with open(os.path.join(ROOT, path)) as f:
        for line in f:
            parts = line.split()
            if len(parts) != 5:
                continue
            name, x, y, w, h = parts[0], *map(int, parts[1:])
            name = FIXES.get(name, name)
            frames[name] = {"img": image, "x": x, "y": y, "w": w, "h": h}

out = os.path.join(ROOT, "assets/sprites/atlas.json")
with open(out, "w") as f:
    json.dump({"frames": dict(sorted(frames.items()))}, f, separators=(",", ":"))
print(f"wrote {len(frames)} frames -> {os.path.relpath(out, ROOT)}")
