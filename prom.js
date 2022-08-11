module.exports.Client = class PromClient {
  constructor(endpoint, headers = {}) {
    this.endpoint = endpoint;
    this.headers = headers;
  }
  queryInstant(params) {
    return fetch(`${this.endpoint}/api/v1/query?${new URLSearchParams(params).toString()}`, { headers: this.headers })
      .then(resp => resp.json())
      .then(body => {
        console.assert(body.status == 'success' && body.data.resultType == 'vector', 'unexpected response body');
        return body.data.result;
      });
  }
  queryRange(params) {
    return fetch(`${this.endpoint}/api/v1/query_range?${new URLSearchParams(params).toString()}`, { headers: this.headers })
      .then(resp => resp.json())
      .then(body => {
        console.assert(body.status == 'success' && body.data.resultType == 'matrix', 'unexpected response body');
        return body.data.result;
      })
  }
};

module.exports.Transform = {
  Range: {
    toRows(base = {}) {
      return result => {
        const vecs = result.map(m => m.values.map(([t, v]) => ({ ts: t, value: Number(v), ...base, ...m.metric })));
        return [].concat(...vecs);
      }
    },
    toHeatmapVec(rate = false) {
      return result => {
        const x = result[0].values.map(x => x[0]);
        const y = [...new Set(result.map(m => m.metric.le))].sort((a, b) => b - a).reverse();
        const idx = {};
        for (const m of result) {
          const entries = Object.entries(m.metric).filter(a => a[0] != 'le');
          const key = entries.sort((a, b) => a[0].localeCompare(b[0])).map(a => `${a[0]}=${a[1]}`).join(' ');
          if (idx[key] === undefined) { idx[key] = {} }
          idx[key].metric = Object.fromEntries(entries);
          idx[key][m.metric.le] = m.values.map((_, i) => {
            if (rate) {
              return Number(m.values[i][1]);
            } else {
              return i > 0 ? Number(m.values[i][1]) - Number(m.values[i - 1][1]) : 0;
            }
          });
        }
        return {
          x, y, vec: Object.values(idx).map(z => {
            let empty = true;
            let data = y.map((_, i) => z[y[i]].map((v, j) => {
              const delta = v - (i > 0 ? z[y[i - 1]][j] : 0);
              if (delta > 0) {
                empty = false;
                return delta;
              } else {
                return null
              }
            }))
            return { metric: z.metric, empty: empty, z: data };
          })
        };
      }
    },
  },
  Instant: {
    toRows(base = {}) {
      return result => result.map(m => ({ ts: m.value[0], value: Number(m.value[1]), ...base, ...m.metric }))
    },
  },
};
