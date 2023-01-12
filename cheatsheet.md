## Query data from grafana

```js
(async (queries, endpoint='/api/datasources/proxy/1/api/v1/query_range') => {
  if (queries.length == 0) { return }
  const params = new URLSearchParams(window.location.search);
  const end = (params.get('to') || Date.now()) / 1000;
  const start = (params.get('from') || (end - 3600000)) / 1000;
  const id = (params.get('var-tidb_cluster') || '');
  const digest = queries.join('|').split('').reduce((a,b)=>{a=((a<<5n)-a)+BigInt(b.charCodeAt(0));return a&0xffffffffn},0n).toString(16).padStart(8, '0');
  // fetch data
  const data = await Promise.all(queries.map(async query => ({
    query,
    response: await fetch(endpoint + '?' + new URLSearchParams([
      ['query', query], ['start', start], ['end', end], ['step', 15]
    ])).then(resp => resp.json()),
  })));
  // download
  const a = document.createElement('a');
  a.setAttribute('href', URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'})));
  a.setAttribute('download', `tidb${id}-${digest}-${Math.round(start)}-${Math.round(end)}.json`);
  a.click();
})([
  // queries
]);
```

```js
(async (queries, endpoint='/api/datasources/proxy/1/api/v1/query_range') => {
  if (queries.length == 0) { return }
  const params = new URLSearchParams(window.location.search);
  const end = (params.get('to') || Date.now()) / 1000;
  const start = (params.get('from') || (end - 3600000)) / 1000;
  const id = (params.get('var-tidb_cluster') || '');
  const digest = queries.join('|').split('').reduce((a,b)=>{a=((a<<5n)-a)+BigInt(b.charCodeAt(0));return a&0xffffffffn},0n).toString(16).padStart(8, '0');
  // fetch data
  const data = await Promise.all(queries.map(async query => ({
    query,
    response: await fetch(endpoint + '?' + new URLSearchParams([
      ['query', query], ['start', start], ['end', end], ['step', 15]
    ])).then(resp => resp.json()),
  })));
  // upload to file server
  const form = new FormData();
  const path = `pingcap/qa/metrics/tidb${id}-${digest}-${Math.round(start)}-${Math.round(end)}.json`
  form.set(path, JSON.stringify(data));
  await fetch('http://fileserver.pingcap.net/upload', { method: 'POST', mode: 'no-cors', body: form });
  window.open(`http://fileserver.pingcap.net/download/${path}`, '_blank');
})([
  // queries
]);
```

## Common queries

```js
// average query time
(rate(tidb_server_handle_query_duration_seconds_sum{sql_type!="internal"}[1m])) / (rate(tidb_server_handle_query_duration_seconds_count{sql_type!="internal"}[1m]))
sum by (instance) (rate(tidb_server_handle_query_duration_seconds_sum{sql_type!="internal"}[1m])) / sum by (instance) (rate(tidb_server_handle_query_duration_seconds_count{sql_type!="internal"}[1m]))

//
```

## VegaLite snippets

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "url": "http://172.16.4.191:8090/metrics/bucket/FIXME"
  },
  "mark": {"type": "rect", "tooltip": true},
  "width": 600,
  "encoding": {
    "x": {
      "field": "t",
      "type": "temporal",
      "timeUnit": {"unit": "hoursminutesseconds", "step": 15}
    },
    "y": {"field": "b", "type": "ordinal", "title": null, "scale": {"reverse": true}},
    "color": {"field": "v", "aggregate": "sum", "type": "quantitative"},
    "row": {"field": "instance"}
  }
}
```
