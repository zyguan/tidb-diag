module.exports = {
    database_time: {
        prom: {
            endpoint: 'http://127.0.0.1:9090',
            headers: {},
        },
        selector: 'tidb_cluster=""',
        interval: '3m',
        time: 1659533400,
    },
    duration_heatmap: {
        prom: {
            endpoint: 'http://127.0.0.1:9090',
            headers: {},
        },
        selector: 'tidb_cluster=""',
        start: 1659533160,
        end: 1659533700,
        step: 15,
    },
}
