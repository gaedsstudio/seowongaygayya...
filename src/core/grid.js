// ───────────────────────────────────────────────────────────────
// 공간 해시 그리드: 수백 개 유닛의 근접 검색을 빠르게
// ───────────────────────────────────────────────────────────────
export class SpatialGrid {
  constructor(cellSize = 32) {
    this.cell = cellSize;
    this.map = new Map();
  }

  clear() {
    this.map.clear();
  }

  key(cx, cy) {
    return cx * 73856093 ^ cy * 19349663;
  }

  insert(obj) {
    const cx = Math.floor(obj.x / this.cell);
    const cy = Math.floor(obj.y / this.cell);
    const k = this.key(cx, cy);
    let arr = this.map.get(k);
    if (!arr) this.map.set(k, (arr = []));
    arr.push(obj);
  }

  /** (x,y) 반경 r 안의 객체를 out 배열에 담아 반환 (원 판정은 호출자가) */
  query(x, y, r, out = []) {
    out.length = 0;
    const c = this.cell;
    const x0 = Math.floor((x - r) / c);
    const x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c);
    const y1 = Math.floor((y + r) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const arr = this.map.get(this.key(cx, cy));
        if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]);
      }
    }
    return out;
  }

  /** 반경 r 안에서 가장 가까운 객체 (filter 선택) */
  nearest(x, y, r, filter) {
    const list = this.query(x, y, r, this._tmp || (this._tmp = []));
    let best = null;
    let bd = r * r;
    for (const o of list) {
      if (filter && !filter(o)) continue;
      const dx = o.x - x;
      const dy = o.y - y;
      const d = dx * dx + dy * dy;
      if (d <= bd) {
        bd = d;
        best = o;
      }
    }
    return best;
  }
}
