// Computes the mechanical answers (Q1, Q3, Q5, Q7) from the local data pull.
// Run: node scripts/answer-easy.js
import { readFileSync } from 'fs';
const listings = JSON.parse(readFileSync(new URL('../data/listings.json', import.meta.url)));
const rentals = JSON.parse(readFileSync(new URL('../data/rentals.json', import.meta.url)));
const projects = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url)));

console.log('=== Q1: total_listing_records ===');
console.log('Retrievable listing records:', listings.length);

console.log('\n=== Q3: active_listings ===');
const active = listings.filter(l => l.is_live === true);
console.log('is_live === true count:', active.length);
console.log('is_live === false count:', listings.filter(l => l.is_live === false).length);
console.log('is_live missing/other:', listings.length - active.length - listings.filter(l => l.is_live === false).length);

console.log('\n=== Sanity check: distinct locality strings in rentals (looking for "kompally") ===');
const localities = new Set(rentals.map(r => r.locality));
console.log([...localities].filter(l => l && l.toLowerCase().includes('kompally')));
console.log('All distinct rental localities (first 30):', [...localities].slice(0, 30));

console.log('\n=== Q5: total_monthly_rent (locality = kompally, case/whitespace-insensitive) ===');
const kompallyRentals = rentals.filter(r => (r.locality || '').trim().toLowerCase() === 'kompally');
console.log('Matching rental records:', kompallyRentals.length);
const totalRent = kompallyRentals.reduce((sum, r) => sum + (r.price || 0), 0);
console.log('Sum of price (monthly rent, INR):', totalRent);

console.log('\n=== Q7: costliest_project ===');
const costliest = projects.reduce((max, p) =>
  (p.price_max === undefined || p.price_max === null) ? max :
  (!max || p.price_max > max.price_max) ? p : max
, null);
console.log(JSON.stringify({ project_id: costliest.project_id, price_max_inr: costliest.price_max }, null, 2));

console.log('\n=== Extra sanity: any listings with is_live missing entirely? ===');
console.log(listings.filter(l => l.is_live === undefined).length);
