const conf = require('./conf').database_time;
const prom = require('./prom');

function tidb_database_time(selector = '', interval = '3m') {
    return [
        {
            id: 'conn.idle',
            name: 'Idle',
            expr: `sum(rate(tidb_server_conn_idle_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'conn.idle.in-txn',
            parent: 'conn.idle',
            name: 'In Txn',
            expr: `sum(rate(tidb_server_conn_idle_duration_seconds_sum{in_txn="1",${selector}}[${interval}]))`,
        },
        {
            id: 'conn.idle.out-txn',
            parent: 'conn.idle',
            name: 'Out Txn',
            expr: `sum(rate(tidb_server_conn_idle_duration_seconds_sum{in_txn="0",${selector}}[${interval}]))`,
        },
        {
            id: 'conn.dispatch',
            name: 'Dispatch',
            expr: `sum(rate(tidb_server_handle_query_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'conn.get-token',
            parent: 'conn.dispatch',
            name: 'Wait Token',
            expr: `sum(rate(tidb_server_get_token_duration_seconds_sum{${selector}}[${interval}])) / 1e6`,
        },
        {
            id: 'session.parse',
            parent: 'conn.dispatch',
            name: 'Parse',
            expr: `sum(rate(tidb_session_parse_duration_seconds_sum{sql_type!="internal",${selector}}[${interval}]))`
        },
        {
            id: 'session.compile',
            parent: 'conn.dispatch',
            name: 'Compile',
            expr: `sum(rate(tidb_session_compile_duration_seconds_sum{sql_type!="internal",${selector}}[${interval}]))`
        },
        {
            id: 'session.execute',
            parent: 'conn.dispatch',
            name: 'Execute',
            expr: `sum(rate(tidb_session_execute_duration_seconds_sum{sql_type!="internal",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.locking',
            parent: 'session.execute',
            name: 'Try Lock',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase=~".*:locking",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.locking.build',
            parent: 'stmt.locking',
            name: 'Build',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="build:locking",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.locking.open',
            parent: 'stmt.locking',
            name: 'Open',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="open:locking",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.locking.next',
            parent: 'stmt.locking',
            name: 'Next',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="next:locking",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.locking.lock',
            parent: 'stmt.locking',
            name: 'Lock',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="lock:locking",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.execute',
            parent: 'session.execute',
            name: 'Run',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase=~".*:final",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.execute.build',
            parent: 'stmt.execute',
            name: 'Build',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="build:final",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.execute.open',
            parent: 'stmt.execute',
            name: 'Open',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="open:final",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.execute.next',
            parent: 'stmt.execute',
            name: 'Next',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="next:final",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.execute.lock',
            parent: 'stmt.execute',
            name: 'Lock',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="lock:final",${selector}}[${interval}]))`,
        },
        {
            id: 'stmt.commit',
            parent: 'session.execute',
            name: 'Commit',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase=~"commit:.*",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.prewrite',
            parent: 'stmt.commit',
            name: 'Prewrite',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:prewrite",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.commit',
            parent: 'stmt.commit',
            name: 'Commit',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:commit",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.wait',
            parent: 'stmt.commit',
            name: 'Wait',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase=~"commit:wait:.*",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.wait.commit-ts',
            parent: 'stmt.commit.wait',
            name: 'commit-ts',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:wait:commit-ts",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.wait.latest-ts',
            parent: 'stmt.commit.wait',
            name: 'latest-ts',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:wait:latest-ts",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.wait.local-latch',
            parent: 'stmt.commit.wait',
            name: 'local-latch',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:wait:local-latch",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.commit.wait.prewrite-binlog',
            parent: 'stmt.commit.wait',
            name: 'prewrite-binlog',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="commit:wait:prewrite-binlog",${selector}}[${interval}]))`
        },
        {
            id: 'stmt.response',
            parent: 'session.execute',
            name: 'Write Response',
            expr: `sum(rate(tidb_executor_phase_duration_seconds_sum{internal="0",phase="write-response",${selector}}[${interval}]))`,
        },
    ];
}

function tikv_database_time(selector = '', interval = '3m') {
    return [
        {
            id: 'grpc.read',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type=~"coprocessor|kv_get|kv_batch_get",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.read.coprocessor',
            parent: 'grpc.read',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="coprocessor",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.wait.schedule',
            parent: 'grpc.read.coprocessor',
            expr: `sum(rate(tikv_coprocessor_request_wait_seconds_sum{type="schedule",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.wait.snapshot',
            parent: 'grpc.read.coprocessor',
            expr: `sum(rate(tikv_coprocessor_request_wait_seconds_sum{type="snapshot",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.build',
            parent: 'grpc.read.coprocessor',
            expr: `sum(rate(tikv_coprocessor_request_handler_build_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.build.index',
            parent: 'coprocessor.build',
            expr: `sum(rate(tikv_coprocessor_request_handler_build_seconds_sum{req="index",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.build.select',
            parent: 'coprocessor.build',
            expr: `sum(rate(tikv_coprocessor_request_handler_build_seconds_sum{req="select",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.process',
            parent: 'grpc.read.coprocessor',
            expr: `sum(rate(tikv_coprocessor_request_duration_seconds_sum{${selector}}[${interval}])) - sum(rate(tikv_coprocessor_request_wait_seconds_sum{type="all",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.process.index',
            parent: 'coprocessor.process',
            expr: `sum(rate(tikv_coprocessor_request_duration_seconds_sum{req="index",${selector}}[${interval}])) - sum(rate(tikv_coprocessor_request_wait_seconds_sum{req="index",type="all",${selector}}[${interval}]))`,
        },
        {
            id: 'coprocessor.process.select',
            parent: 'coprocessor.process',
            expr: `sum(rate(tikv_coprocessor_request_duration_seconds_sum{req="select",${selector}}[${interval}])) - sum(rate(tikv_coprocessor_request_wait_seconds_sum{req="select",type="all",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.read.get',
            parent: 'grpc.read',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_get",${selector}}[${interval}]))`,
        },
        {
            id: 'get.snapshot',
            parent: 'grpc.read.get',
            expr: `sum(rate(tikv_scheduler_command_duration_seconds_sum{type="get",${selector}}[${interval}])) - sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="get",${selector}}[${interval}]))`,
        },
        {
            id: 'get.process',
            parent: 'grpc.read.get',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="get",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.read.batch-get',
            parent: 'grpc.read',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_batch_get",${selector}}[${interval}]))`,
        },
        {
            id: 'batch-get.snapshot',
            parent: 'grpc.read.batch-get',
            expr: `sum(rate(tikv_scheduler_command_duration_seconds_sum{type="batch_get",${selector}}[${interval}])) - sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="batch_get",${selector}}[${interval}]))`,
        },
        {
            id: 'batch-get.process',
            parent: 'grpc.read.batch-get',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="batch_get",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.write',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type=~"kv_prewrite|kv_commit|kv_pessimistic_lock|kv_check_txn_status",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.write.prewrite',
            parent: 'grpc.write',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_prewrite",${selector}}[${interval}]))`,
        },
        {
            id: 'prewrite.latch',
            parent: 'grpc.write.prewrite',
            expr: `sum(rate(tikv_scheduler_latch_wait_duration_seconds_sum{type="prewrite",${selector}}[${interval}]))`,
        },
        {
            id: 'prewrite.process',
            parent: 'grpc.write.prewrite',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="prewrite",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.write.commit',
            parent: 'grpc.write',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_commit",${selector}}[${interval}]))`,
        },
        {
            id: 'commit.latch',
            parent: 'grpc.write.commit',
            expr: `sum(rate(tikv_scheduler_latch_wait_duration_seconds_sum{type="commit",${selector}}[${interval}]))`,
        },
        {
            id: 'commit.process',
            parent: 'grpc.write.commit',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="commit",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.write.pessimistic-lock',
            parent: 'grpc.write',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_pessimistic_lock",${selector}}[${interval}]))`,
        },
        {
            id: 'pessimistic-lock.latch',
            parent: 'grpc.write.pessimistic-lock',
            expr: `sum(rate(tikv_scheduler_latch_wait_duration_seconds_sum{type="acquire_pessimistic_lock",${selector}}[${interval}]))`,
        },
        {
            id: 'pessimistic-lock.process',
            parent: 'grpc.write.pessimistic-lock',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="acquire_pessimistic_lock",${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.write.check-txn-status',
            parent: 'grpc.write',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type="kv_check_txn_status",${selector}}[${interval}]))`,
        },
        {
            id: 'check-txn-status.latch',
            parent: 'grpc.write.check-txn-status',
            expr: `sum(rate(tikv_scheduler_latch_wait_duration_seconds_sum{type="check_txn_status",${selector}}[${interval}]))`,
        },
        {
            id: 'check-txn-status.process',
            parent: 'grpc.write.check-txn-status',
            expr: `sum(rate(tikv_scheduler_processing_read_duration_seconds_sum{type="check_txn_status",${selector}}[${interval}]))`,
        },
        {
            id: 'async-write',
            parent: 'grpc.write',
            expr: `sum(rate(tikv_storage_engine_async_request_duration_seconds_sum{type="write",${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.propose-wait',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_store_wf_batch_wait_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.process-cmd',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_store_wf_send_to_queue_duration_seconds_sum{${selector}}[${interval}])) - sum(rate(tikv_raftstore_store_wf_batch_wait_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.commit-log',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_store_wf_commit_log_duration_seconds_sum{${selector}}[${interval}])) - sum(rate(tikv_raftstore_store_wf_send_to_queue_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.persist-log',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_store_wf_write_end_duration_seconds_sum{${selector}}[${interval}])) - sum(rate(tikv_raftstore_store_wf_send_to_queue_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.apply-wait',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_apply_wait_time_duration_secs_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'async-write.apply-log',
            parent: 'async-write',
            expr: `sum(rate(tikv_raftstore_apply_log_duration_seconds_sum{${selector}}[${interval}]))`,
        },
        {
            id: 'grpc.other',
            expr: `sum(rate(tikv_grpc_msg_duration_seconds_sum{type!~"coprocessor|kv_get|kv_batch_get|kv_prewrite|kv_commit|kv_pessimistic_lock|kv_check_txn_status",${selector}}[${interval}]))`,
        },
    ]
}

(async function () {
    const cli = new prom.Client(conf.prom.endpoint, conf.prom.headers);
    let text = JSON.stringify({meta: conf, database_time: {
        tidb: await Promise.all(
            tidb_database_time(conf.selector, conf.interval)
                .map(it => cli.queryInstant({ query: it.expr, time: conf.time }).then(result => ({ value: Number(result[0].value[1]), ...it })))
        ),
        tikv: await Promise.all(
            tikv_database_time(conf.selector, conf.interval)
                .map(it => cli.queryInstant({ query: it.expr, time: conf.time }).then(result => ({ value: Number(result[0].value[1]), ...it })))
        ),
    }});
    if (process.argv[2] != 'data') {
        text = require('fs').readFileSync(__dirname + "/diag.database_time.html", {encoding: 'utf8'}).replace('__FIXME__', text);
    }
    console.log(text);
}())
