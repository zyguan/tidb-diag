#!/usr/bin/env -S deno run -A

import { serve, Status, STATUS_TEXT } from "https://deno.land/std@0.171.0/http/mod.ts";
import { sprintf } from "https://deno.land/std@0.171.0/fmt/printf.ts";
import * as log from "https://deno.land/std@0.171.0/log/mod.ts";
import jmespath from "npm:jmespath@0.16.0";
import * as transform from '../transfom.js';


/** @type {import("https://deno.land/std@0.171.0/http/server.ts").Handler} */
const handler = async (request) => {
  const url = new URL(request.url);
  const m = /^\/metrics(\/default|\/counter|\/bucket)?\//.exec(url.pathname);
  if (request.method === 'GET' && m) {
    let flatten = transform.flattenDefault;
    if (m[1] === '/bucket') {
      flatten = transform.flattenBucket;
    } else if (m[1] === '/counter') {
      flatten = transform.flattenCounter;
    }
    const name = url.pathname.substring(m[0].length);
    const path = url.searchParams.get('path');
    const action = url.searchParams.get('action');
    const desc = name + (path ? '#'+path : '') + (action ? ' | '+action : '');
    const start = Date.now();
    try {
      const resp = await fetch(`http://fileserver.pingcap.net/download/pingcap/qa/metrics/${name}`);
      if (!resp.ok) {
        return new Response(STATUS_TEXT[resp.status], { status: resp.status });
      }
      let data = await resp.json();
      if (path) { data = jmespath.search(data, path) }
      data = flatten(data);
      if (action) { data = jmespath.search(data, action) }
      return Response.json(data, {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (err) {
      log.error('failed to trasform %s: %v', desc, err);
      console.log(err);
      return new Response(sprintf('%v', err), { status: Status.BadRequest });
    } finally {
      log.info('transform %s [%dms]', desc, Date.now()-start);
    }
  } else {
    return new Response(STATUS_TEXT[Status.NotFound], { status: Status.NotFound });
  }
};

log.setup({
  handlers: {
    default: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: r => `${r.datetime.toISOString()} ${r.levelName} - ${sprintf(r.msg, ...r.args)}`,
    })
  },
});

await serve(handler, {
  port: Deno.env.get('PORT') || 3000,
  onListen: ({ hostname, port }) => log.info(`listening on http://${hostname}:${port}/`),
});
