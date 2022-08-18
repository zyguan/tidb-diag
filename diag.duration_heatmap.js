const conf = require('./conf').duration_heatmap;
const prom = require('./prom');

function duration_heatmap(selector = '') {
    return [
        {
            id: 'query.slow',
            expr: `sum by (le) (tidb_server_slow_query_process_duration_seconds_bucket{${selector}})`,
        },
        {
            id: 'query',
            expr: `sum by (le, sql_type) (tidb_server_handle_query_duration_seconds_bucket{${selector}})`,
        },
        {
            id: 'copr',
            expr: `sum by (le) (tidb_tikvclient_cop_duration_seconds_bucket{${selector}})`
        },
        {
            id: 'kvreq',
            expr: `sum by (le, type) (tidb_tikvclient_request_seconds_bucket{${selector}})`,
        },
        {
            id: 'kvreq.store',
            expr: `sum by (le, store) (tidb_tikvclient_request_seconds_bucket{${selector}})`,
        },
        {
            id: 'kvreq.backoff',
            expr: `sum by (le, type) (tidb_tikvclient_backoff_seconds_bucket{${selector}})`,
        },
        {
            id: 'kvreq.batch.wait',
            expr: `sum by (le) (tidb_tikvclient_batch_wait_duration_bucket{${selector}})`,
        },
        {
            id: 'kvreq.batch.send',
            expr: `sum by (le) (tidb_tikvclient_batch_send_latency_bucket{${selector}})`,
        },
        {
            id: 'kvreq.batch.recv',
            expr: `sum by (le) (tidb_tikvclient_batch_recv_latency_bucket{${selector}})`,
        },
        {
            id: 'kvrpc.read',
            expr: `sum by (le, type) (tikv_grpc_msg_duration_seconds_bucket{type=~"coprocessor|kv_get|kv_batch_get",${selector}})`,
        },
        {
            id: 'kvrpc.write',
            expr: `sum by (le, type) (tikv_grpc_msg_duration_seconds_bucket{type=~"kv_prewrite|kv_commit|kv_pessimistic_lock|kv_check_txn_status",${selector}})`,
        },
        {
            id: 'raft.propose-wait',
            expr: `sum by (le) (tikv_raftstore_request_wait_time_duration_secs_bucket{${selector}})`,
        },
        {
            id: 'raft.apply-wait',
            expr: `sum by (le) (tikv_raftstore_apply_wait_time_duration_secs_bucket{${selector}})`,
        },
        // {
        //     id: 'rocksdb.store',
        //     expr: `sum by (le, type) (tikv_raftstore_store_perf_context_time_duration_secs_bucket{${selector}})`,
        // },
        // {
        //     id: 'rocksdb.apply',
        //     expr: `sum by (le, type) (tikv_raftstore_apply_perf_context_time_duration_secs_bucket{${selector}})`,
        // },
    ]
}

(async function () {
    const cli = new prom.Client(conf.prom.endpoint, conf.prom.headers);
    let text = JSON.stringify({
        meta: conf,
        duration_heatmap: await Promise.all(duration_heatmap(conf.selector).map(
            it => cli
                .queryRange({ query: it.expr, start: conf.start, end: conf.end, step: conf.step })
                .then(prom.Transform.Range.toHeatmapVec())
                .then(data => ({...it, ...data}))
        ))
    });
    if (process.argv[2] != 'data') {
        text = require('fs').readFileSync(__dirname + "/diag.duration_heatmap.html", { encoding: 'utf8' }).replace('__FIXME__', text);
    }
    console.log(text);
}())
