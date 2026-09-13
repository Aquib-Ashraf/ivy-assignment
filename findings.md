# Findings log

Running notes as I confirm each documentation/API mismatch. Converted into
the `findings` array in `submission.json` at the end. Each one below has
already been reproduced against real API responses — nothing here is a guess.

---

## 1. Auth: key must go in a header, not a query parameter

- **endpoint**: `*`
- **category**: `auth`
- **documented**: "Append your API key as a query parameter: `?api_key=IVY26-...`"
- **actual**: any request sent with `?api_key=...` is rejected with `401`, body: `"send your key in the X-API-Key request header, not as a query parameter"`. Must send `X-API-Key: <key>` as a header instead.
- **how_found**: called `/v1/listings` exactly as documented, got the 401 back with that exact detail message
- **impact**: every single endpoint is unusable if you follow the docs literally
- **evidence**: []

## 2. Auth: login response shape doesn't match docs

- **endpoint**: `/auth/login`
- **category**: `auth`
- **documented**: response has a field called `token`; "There is no refresh flow."
- **actual**: response field is called `access_token`, not `token`. There is ALSO a `refresh_token` and a `refresh_url: "/auth/refresh"` — directly contradicting "no refresh flow."
- **how_found**: called `/auth/login` with real demo credentials, inspected the raw response body
- **impact**: any frontend built by trusting the doc's `token` field name will silently fail to store the token
- **evidence**: []

## 3. Auth: token lifetime is far shorter than documented

- **endpoint**: `/auth/login`
- **category**: `auth`
- **documented**: "Tokens are valid for 24 hours, so a single login is enough for one working session."
- **actual**: response `expires_in: 900` — 15 minutes, not 24 hours (86400s)
- **how_found**: read `expires_in` directly off the real login response
- **impact**: a frontend built assuming a 24h token will silently start failing requests ~15 minutes after login unless it uses the (undocumented-as-necessary) refresh flow
- **evidence**: []

## 4. Pagination: the documented parameter is wrong — it's `offset`, not `page`

- **endpoint**: `/v1/listings` (also `/v1/rentals`, `/v1/projects`)
- **category**: `pagination`
- **documented**: "Every collection endpoint takes `page` and `limit`." (`page` described as 1-indexed, default `1`)
- **actual**: the API does not use `page` at all. It uses `offset`/`limit`, and reports whether more data exists via a `has_more` boolean. Sending `page=2`, `page=3`, etc. is silently ignored — the server just keeps returning the same first batch (`offset=0`) every time, since it has no idea what `page` means.
- **how_found**: sent `page=1..500` as documented; every single response was identical — same 50 records, same `listing_id`s. Deduping by `listing_id` across "500 pages" produced only 50 unique records, proving nothing was actually advancing. Inspected the raw response body directly and found the real key set: `limit, offset, count, total, has_more, results`.
- **impact**: this alone makes it impossible to ever retrieve more than the first 50 records if you follow the documentation as written — arguably the single most consequential error in the whole reference, since it blocks every other question that depends on the full dataset (Q1, Q2, Q3, Q5, Q6, Q8, Q9, Q10 all need the full retrievable set)
- **evidence**: []

## 5. `limit` is capped at 50 regardless of requested value

- **endpoint**: `/v1/listings` (also observed on `/v1/rentals`, `/v1/projects`)
- **category**: `pagination`
- **documented**: "`limit` — Maximum `200`"
- **actual**: requesting `limit=200` returns exactly 50 records per call regardless (`count: 50` in the response even when `limit: 50` is echoed back, not the 200 that was requested)
- **how_found**: sent `limit=200` on every request; response consistently echoed `limit: 50, count: 50`
- **impact**: fetching the full dataset takes ~4x more requests than the docs would suggest is necessary; not a correctness bug, just a documented ceiling that isn't real
- **evidence**: []

## 5. Pagination: `total` undercounts the real number of records

- **endpoint**: `/v1/listings`, `/v1/rentals`, `/v1/projects`
- **category**: `pagination`
- **documented**: "`total` is the exact number of records matching your filters. To fetch every record, read `total`... and request that many pages."
- **actual**: paging all the way to the true end (confirmed via the server's own `has_more: false` flag, using the real `offset`-based mechanism — see finding #4) produced MORE records than `total` claimed, for all three endpoints:
  - listings: `total=4157`, actual retrievable = **4400**
  - rentals: `total=1559`, actual retrievable = **1650**
  - projects: `total=444`, actual retrievable = **470**
- **how_found**: paged each endpoint using the real `offset`/`limit`/`has_more` mechanism until `has_more: false`, deduping by id along the way, and counted actual unique records collected
- **impact**: any client that trusts `total` to know when to stop will silently miss real records — directly affects the "retrievable" counts the assignment asks for in Q1, Q5, Q8
- **evidence**: [] (endpoint-level behavior, not specific records — will add specific IDs from the extra tail records if useful)

## 6. `/v1/favourites` does not exist — the real path is `/v1/saved`

- **endpoint**: `/v1/favourites`
- **category**: `missing_endpoint`
- **documented**: `GET /v1/favourites`, `POST /v1/favourites`, `DELETE /v1/favourites/{id}` — save/list/remove favourites
- **actual**: `GET /v1/favourites` (correct auth header + valid bearer token) returns `404 Not Found`. The real, working path is `GET /v1/saved`, which returns the exact shape the docs described for favourites: `{"count": 0, "results": []}`.
- **how_found**: `/v1/favourites` gave a clean 404 even with a valid token. Tried a few reasonable alternate names; `/v1/saved` returned `401` (not `404`) when called WITHOUT a bearer token — a 401 instead of 404 was the signal it's a real path just missing auth. Retried with a valid `Authorization: Bearer` token and got `200` with the documented response shape.
- **impact**: the "saved listings" frontend requirement must hit `/v1/saved`, `/v1/saved` (POST/DELETE presumably), not `/v1/favourites` as documented — need to confirm POST/DELETE shapes too before building the frontend feature
- **evidence**: []

## 7. `/v1/analytics/summary` does not exist at the documented path

- **endpoint**: `/v1/analytics/summary`
- **category**: `missing_endpoint`
- **documented**: `GET /v1/analytics/summary` — pre-computed aggregates for the insights dashboard
- **actual**: returns `404 Not Found`
- **how_found**: called it directly, with correct auth
- **impact**: the required insights screen cannot be built against this path. `/llms.txt` (see below) hints the real path may be `/v2/insights/summary` — not yet confirmed against the live API
- **evidence**: []

## 8. Undocumented endpoint: `/llms.txt`

- **endpoint**: `/llms.txt`
- **category**: `undocumented_endpoint`
- **documented**: not mentioned anywhere in `API_REFERENCE.md`
- **actual**: exists, unauthenticated, returns a markdown file explicitly addressed to AI agents, containing per-city summary statistics (listing counts, dedup counts, live counts, projects with wrong counts) and a list of other undocumented paths (`/v2/listings`, `/v2/insights/summary`, `/llms-full.txt`, `/sitemap.xml`, etc.)
- **how_found**: seen referenced as `for_agents` in the API root response; fetched directly
- **impact**: none by itself, but IMPORTANT — this file's own text says it was written by the same unreviewed AI process as the main docs, and its sitemap description literally admits to listing "several [properties] that never were." Treating its numbers as ground truth would be a mistake. CONFIRMED: `/llms.txt` advertises `/v2/listings`, `/v2/insights/summary` etc. as real, working endpoints — calling `/v2/insights/summary` directly returns `404` with the API's own message: *"there is no /v2; llms.txt announced it early. The API is /v1."* The API itself confirms this file contains false information. Not using its stats as answers.
- **evidence**: []

---

## Still to check
- Does `/v2/insights/summary` actually exist and work? (real replacement for analytics?)
- Real path for favourites — try `/v2/...` variants
- Units: is money/area always in the claimed units across a sample of records?
- Timestamps: is `posted_at` really UTC as claimed, or does it carry an offset like `/health` does?
- Duplicate detection hypothesis for Q2
- Fake listing detection hypothesis for Q9
- Corrupt/impossible record detection for Q4
