# Ivy Homes Assignment

This is my submission for the Ivy Homes internship assignment. Notes below on how to run things, and how I actually went about this — I'll keep updating this file as I go rather than writing it all at the end.

## Running the data pull

I wrote a small script that logs in and pulls every listing, rental, and project for my key, page by page, and saves them as JSON so I'm not hammering the API every time I want to check something.

```
npm install
cp .env.example .env
```

Then fill in `.env` with the API key and login details from my registration email, and run:

```
npm run pull
```

It logs in, checks `/health` and `/llms.txt`, then pages through `/v1/listings`, `/v1/rentals`, `/v1/projects` until it has everything, and writes it all into a `data/` folder. It also prints out the number the server reports as `total` next to how many records I actually got by paging to the end — if those don't match, that's already a discrepancy worth digging into.

## How I'm approaching the discrepancy-hunting

(filling this in properly once I'm through the data — for now, the plan is: pull everything once, then work through each of the 10 questions by testing a specific guess against the real data rather than assuming the docs are right.)

## What I checked that turned out to be fine

(to fill in — there will be things I suspected were wrong that weren't)

## What I'd do further

(to fill in near the end)
