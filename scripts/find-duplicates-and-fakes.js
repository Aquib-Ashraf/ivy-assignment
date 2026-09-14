import { readFileSync } from 'fs';

const listings = JSON.parse(readFileSync(new URL('../data/listings.json', import.meta.url)));

console.log('=== Deep Scan: Unique Properties (Q2) & Fake Listings (Q9) ===');

// --- Q2: Unique Properties ---
// Group listings by: locality + apartment_name + bedroom + floor + carpet_area
const propGroups = new Map();

listings.forEach(l => {
  const apartment = (l.apartment_name || '').trim().toLowerCase();
  const locality = (l.locality || '').trim().toLowerCase();
  const bhk = l.bedroom || 0;
  const floor = l.floor || 0;
  const area = l.carpet_area || l.super_built_up_area || 0;
  
  // Fingerprint for physical property
  const key = `${locality}|${apartment}|${bhk}|${floor}|${area}`;
  
  if (!propGroups.has(key)) {
    propGroups.set(key, []);
  }
  propGroups.get(key).push(l);
});

let duplicateGroupCount = 0;
propGroups.forEach((group) => {
  if (group.length > 1) {
    duplicateGroupCount++;
  }
});

console.log(`Total listing records: ${listings.length}`);
console.log(`Groups with duplicate listings: ${duplicateGroupCount}`);
console.log(`Distinct physical properties count (unique_properties): ${propGroups.size}`);

// --- Q9: Fake Listings ---
// Scan for fake/lead-gen signals: exact identical descriptions across different listings,
// placeholder seller phone numbers, or repeated dummy contacts.
const descMap = new Map();
listings.forEach(l => {
  const d = (l.description || '').trim();
  if (d.length > 20) {
    if (!descMap.has(d)) descMap.set(d, []);
    descMap.get(d).push(l.listing_id);
  }
});

const fakeIds = new Set();

// Flag exact duplicate descriptions across different apartment names/localities
descMap.forEach((ids, desc) => {
  if (ids.length > 5) { // Suspicious template spam across 5+ listings
    ids.forEach(id => fakeIds.add(id));
  }
});

// Flag invalid seller contact numbers
listings.forEach(l => {
  const contact = l.posted_by_contact || '';
  if (contact.includes('0000000000') || contact.includes('1234567890')) {
    fakeIds.add(l.listing_id);
  }
});

const sortedFakeIds = Array.from(fakeIds).sort();

console.log(`\n--- Q9: Fake Listings ---`);
console.log(`Found ${sortedFakeIds.length} fake listing records.`);
console.log(`fake_listing_ids:`, JSON.stringify(sortedFakeIds, null, 2));