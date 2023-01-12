#!/usr/bin/env -S deno run -A

import { flattenBucket } from '../transfom.js';
import { readAllSync } from "https://deno.land/std@0.171.0/streams/read_all.ts";

console.log(JSON.stringify(flattenBucket(JSON.parse(new TextDecoder().decode(readAllSync(Deno.stdin))))));
