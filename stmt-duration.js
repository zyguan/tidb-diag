/*
 * Usage:
 *   record baseline: `node stmt-duration.js > baseline.json`
 *   compare with baseline: `node stmt-duration.js baseline.json > result.csv`
 */

const conf = require('./conf').stmt_duration;
const prom = require('./prom');

function statement_duration(selector = '', interval = '3m', prefix = '') {
    return `sum(rate(tidb_server_txn_stmt_duration_sum{${selector}, type=~"${prefix}.*"}[${interval}])) by (type) / ` +
            `sum(rate(tidb_server_txn_stmt_duration_count{${selector}, type=~"${prefix}.*"}[${interval}])) by (type)`
}

(async function () {
    const cli = new prom.Client(conf.prom.endpoint, conf.prom.headers);
    const expr = statement_duration(conf.selector, conf.interval, conf.prefix);
    let result = {meta: conf, result:
        await (cli.queryInstant({ query: expr, time: conf.time })).then(result => result.map(item => {
            return {
                type: item.metric.type,
                value: item.value[1]
            }
        }).sort((a, b) => parseInt(a.type.split('-')[1]) - parseInt(b.type.split('-')[1])))
    }
    if (process.argv[2]) {
        baseline = JSON.parse(require('fs').readFileSync(process.argv[2], {encoding: 'utf8'}))
        const compare = []
        for (let i = 0; i < result.result.length; i++) {
            const diff = 100 * (result.result[i].value - baseline.result[i].value) / baseline.result[i].value
            compare.push({
                type: result.result[i].type,
                baseline: baseline.result[i].value,
                current: result.result[i].value,
                diff,
            })
        }
        console.log('type, baseline, current, diff')
        console.log(compare.map(item => {
            return `${item.type}, ${item.baseline}, ${item.current}, ${item.diff.toFixed(2)}%`
        }).join('\n'))
        return
    }
    console.log(JSON.stringify(result, undefined, 2))
}())
