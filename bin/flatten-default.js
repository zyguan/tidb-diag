#!/usr/bin/env -S deno run -A

import { flattenDefault } from '../transfom.js';
import { readAllSync } from "https://deno.land/std@0.171.0/streams/read_all.ts";

console.log(JSON.stringify(flattenDefault(JSON.parse(new TextDecoder().decode(readAllSync(Deno.stdin))))));
