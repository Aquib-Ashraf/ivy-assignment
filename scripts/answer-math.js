import { readFileSync } from 'fs';

const listings = JSON.parse(readFileSync(new URL('../data/listings.json', import.meta.url)));

// 1. Identify corrupt IDs (same logic as Q4 script)
const corruptSet = new Set(listings.filter(l => {
  const invalidPrice = l.price !== undefined && l.price <= 0;
  const invalidBedroom = l.bedroom !== undefined && l.bedroom <= 0;
  const invalidBathroom = l.bathroom !== undefined && l.bathroom < 0;
  const invalidCarpetArea = l.carpet_area !== undefined && l.carpet_area <= 0;
  const invalidSuperArea = l.super_built_up_area !== undefined && l.super_built_up_area <= 0;
  const carpetExceedsSuper = (l.carpet_area && l.super_built_up_area) ? l.carpet_area > l.super_built_up_area : false;
  const floorExceedsTotal = (l.floor !== undefined && l.total_floors !== undefined) ? l.floor > l.total_floors : false;
  return invalidPrice || invalidBedroom || invalidBathroom || invalidCarpetArea || invalidSuperArea || carpetExceedsSuper || floorExceedsTotal;
}).map(l => l.listing_id));

console.log('=== Q6: avg_price_per_sqft_2bhk ===');

// Filters for Q6: is_live === true, bedroom === 2, not corrupt
const valid2BhkLive = listings.filter(l => 
  l.is_live === true && 
  l.bedroom === 2 && 
  !corruptSet.has(l.listing_id) && 
  l.price > 0 && 
  l.carpet_area > 0
);

const rates = valid2BhkLive.map(l => l.price / l.carpet_area);
const sumRates = rates.reduce((acc, r) => acc + r, 0);
const avgRate = rates.length > 0 ? (sumRates / rates.length) : 0;

console.log(`Matching 2BHK live non-corrupt listings: ${valid2BhkLive.length}`);
console.log(`avg_price_per_sqft_2bhk: ${avgRate.toFixed(2)}`);

console.log('\n=== Q8: listings_last_7_days ===');

// REFERENCE = 2026-09-10T00:00:00+05:30 (IST)
const refEnd = new Date("2026-09-10T00:00:00+05:30").getTime();
const refStart = refEnd - (7 * 24 * 60 * 60 * 1000); // [REFERENCE - 7 days, REFERENCE)

const last7Days = listings.filter(l => {
  if (!l.posted_at) return false;
  // Parse with +05:30 IST assumption
  const tsStr = l.posted_at.endsWith('Z') || l.posted_at.includes('+') ? l.posted_at : `${l.posted_at}+05:30`;
  const t = new Date(tsStr).getTime();
  return t >= refStart && t < refEnd;
});

console.log(`listings_last_7_days: ${last7Days.length}`);