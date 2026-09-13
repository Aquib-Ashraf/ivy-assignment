// Pulls the entire dataset for your API key and saves it to /data as JSON.
// Run: npm install && npm run pull
//
// What this does, and why:
//  - Hits /health and /llms.txt first (cheap, unauthenticated, might reveal
//    undocumented stuff or confirm/deny doc claims about timestamps etc.)
//  - Logs in via /auth/login to get a bearer token (needed for /v1/favourites
//    later, and good to prove login works early)
//  - Pages fully through /v1/listings, /v1/rentals, /v1/projects using the
//    documented page/limit params, and SAVES EVERY RAW PAGE plus the merged
//    result — so you still have the server's exact `total` claims to compare
//    against what you actually received.
//  - Prints a discrepancy check: does total from page 1 match how many
//    records you actually collected by paging to the end? This is exactly
//    the kind of thing the docs claim is trustworthy — verify it, don't
//    assume it.

import 'dotenv/config';
import { writeFile, mkdir } from 'fs/promises';

const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

if (!BASE_URL || !API_KEY) {
  console.error('Missing BASE_URL or API_KEY. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

async function req(path, { method = 'GET', token, body } = {}) {
  const url = new URL(path, BASE_URL);
  // NOTE: the docs say to send the key as ?api_key=..., but the real API
  // rejects that with a 401 telling you to use the X-API-Key header instead.
  // This is a confirmed doc/API mismatch — logged as a finding.
  const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }

  if (!res.ok) {
    console.error(`  ! ${method} ${url.pathname} -> ${res.status}`, json);
  }
  return { status: res.status, ok: res.ok, data: json };
}

// Pages through a collection endpoint using the REAL pagination mechanism.
// NOTE: the docs said to send `page` (1-indexed) and `limit`. The real API
// does not use `page` at all — it uses `offset`/`limit`, and tells you
// whether more data exists via `has_more`. Sending `page` was silently
// ignored, which is why every "page" kept returning the same first 50
// records forever. Confirmed finding — logged separately.
async function pullCollection(name, path, token, idField, extraParams = {}) {
  console.log(`\n== Pulling ${name} (${path}) ==`);
  const limit = 200; // server may still cap this lower — we log what it actually returns
  let offset = 0;
  const seen = new Map(); // id -> record, first occurrence wins
  const rawPages = [];
  let declaredTotal = null;
  let requestCount = 0;

  while (true) {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit), ...extraParams });
    const { ok, data } = await req(`${path}?${params.toString()}`, { token });
    requestCount += 1;
    if (!ok) {
      console.error(`  Stopped early at offset ${offset} due to error above.`);
      break;
    }
    rawPages.push(data);

    const results = data.results ?? [];
    if (declaredTotal === null) declaredTotal = data.total ?? null;

    let newCount = 0;
    for (const rec of results) {
      const id = rec[idField];
      if (!seen.has(id)) {
        seen.set(id, rec);
        newCount += 1;
      }
    }

    console.log(`  offset ${offset}: got ${results.length} records (server's own limit/count=${data.count}), ${newCount} new (unique so far: ${seen.size}${declaredTotal !== null ? ` / server says total=${declaredTotal}` : ''}, has_more=${data.has_more})`);

    if (results.length === 0 || data.has_more === false) break;
    offset += results.length; // advance by what we actually got, not what we asked for
    if (requestCount > 500) {
      console.error('  Safety stop at 500 requests — investigate before trusting this dump.');
      break;
    }
  }

  const all = Array.from(seen.values());
  await mkdir('data', { recursive: true });
  await writeFile(`data/${name}.json`, JSON.stringify(all, null, 2));
  await writeFile(`data/${name}.raw-pages.json`, JSON.stringify(rawPages, null, 2));

  console.log(`  -> saved ${all.length} UNIQUE records (by ${idField}) to data/${name}.json`);
  if (declaredTotal !== null && declaredTotal !== all.length) {
    console.log(`  !! MISMATCH: server's declared total (${declaredTotal}) != unique records actually collected (${all.length}). This is worth a finding.`);
  }
  return all;
}

async function main() {
  console.log('== /health ==');
  console.log(await req('/health'));

  console.log('\n== /llms.txt (undocumented, seen in root response) ==');
  console.log(await req('/llms.txt'));

  console.log('\n== Login ==');
  const login = await req('/auth/login', {
    method: 'POST',
    body: { email: LOGIN_EMAIL, password: LOGIN_PASSWORD },
  });
  console.log(login);
  // NOTE: docs said the field would be called `token`, but the real API
  // returns `access_token` (plus a `refresh_token` and `refresh_url` the
  // docs said would not exist). Also `expires_in` is 900 seconds (15 min),
  // not the 24 hours the docs claimed. All logged as findings.
  const token = login.data?.access_token;
  if (!token) {
    console.error('Login failed — check LOGIN_EMAIL/LOGIN_PASSWORD in .env. Continuing without a token (favourites endpoints will fail).');
  } else {
    console.log(`  Got access_token. expires_in=${login.data?.expires_in}s (docs claimed 86400s/24h — verify this).`);
  }

  await pullCollection('listings', '/v1/listings', token, 'listing_id');
  await pullCollection('rentals', '/v1/rentals', token, 'listing_id');
  await pullCollection('projects', '/v1/projects', token, 'project_id');

  if (token) {
    console.log('\n== /v1/favourites (with token) ==');
    console.log(await req('/v1/favourites', { token }));
  }

  console.log('\n== /v1/analytics/summary ==');
  console.log(await req('/v1/analytics/summary', { token }));

  console.log('\nDone. Check /data for listings.json, rentals.json, projects.json (+ raw-pages versions).');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
