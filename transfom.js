export function flattenDefault(data) {
  const rows = [];
  for (const it of data) {
    for (let i = 0; i < it.values.length; i++) {
      rows.push({
        ...it.metric,
        t: it.values[i][0]*1000,
        v: Number(it.values[i][1]),
      });
    }
  }
  return rows;
}

export function flattenCounter(data) {
  const rows = [];
  for (const it of data) {
    for (let i = 1; i < it.values.length; i++) {
      rows.push({
        ...it.metric,
        t: it.values[i][0]*1000,
        v: Number(it.values[i][1]) - Number(it.values[i-1][1]),
      });
    }
  }
  return rows;
}

export function flattenBucket(data) {
  const bin = v => v === '+Inf' ? Infinity : Number(v);
  const groups = {}, rows = [];
  for (const it of data) {
    const { le, ...metric } = it.metric;
    const key = JSON.stringify(Object.entries(metric).sort());
    const vals = []
    for (let i = 1; i < it.values.length; i++) {
      vals.push({
        ts: it.values[i][0]*1000,
        value: Number(it.values[i][1]) - Number(it.values[i-1][1]),
      });
    }
    if (groups[key] === undefined) { groups[key] = {} }
    groups[key][le] = vals;
  }
  for (const [k, g] of Object.entries(groups)) {
    const metric = Object.fromEntries(JSON.parse(k))
    const buckets = Object.keys(g).sort((a, b) => bin(a) - bin(b));
    for (const v of g[buckets[0]]) {
      if (v.value > 0) {
        rows.push({ ...metric, t: v.ts, v: v.value, b: `0 ~ ${buckets[0]}`, r: [0, bin(buckets[0])] });
      }
    }
    for (let i = 1; i < buckets.length; i++) {
      const vec0 = g[buckets[i-1]], vec1 = g[buckets[i]];
      for (let j = 0; j < vec1.length; j++) {
        const v0 = vec0[j], v1 = vec1[j];
        const delta = v1.value - v0.value;
        if (delta > 0) {
          rows.push({ ...metric, t: v1.ts, v: delta, b: `${buckets[i-1]} ~ ${buckets[i]}`, r: [bin(buckets[i-1]), bin(buckets[i])] });
        }
      }
    }
  }
  return rows;
}
