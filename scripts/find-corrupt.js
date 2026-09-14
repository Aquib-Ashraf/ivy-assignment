import { readFileSync } from 'fs';

const listings = JSON.parse(readFileSync(new URL('../data/listings.json', import.meta.url)));

console.log('=== Checking for Corrupt Listings (Q4) ===');

const corrupt = listings.filter(l => {
  // Check for impossible real estate conditions
  const invalidPrice = l.price !== undefined && l.price <= 0;
  const invalidBedroom = l.bedroom !== undefined && l.bedroom <= 0;
  const invalidBathroom = l.bathroom !== undefined && l.bathroom < 0;
  const invalidCarpetArea = l.carpet_area !== undefined && l.carpet_area <= 0;
  const invalidSuperArea = l.super_built_up_area !== undefined && l.super_built_up_area <= 0;
  const carpetExceedsSuper = (l.carpet_area && l.super_built_up_area) ? l.carpet_area > l.super_built_up_area : false;
  const floorExceedsTotal = (l.floor !== undefined && l.total_floors !== undefined) ? l.floor > l.total_floors : false;

  return invalidPrice || invalidBedroom || invalidBathroom || invalidCarpetArea || invalidSuperArea || carpetExceedsSuper || floorExceedsTotal;
});

console.log(`Found ${corrupt.length} corrupt listing records.\n`);

const corruptIds = corrupt.map(l => l.listing_id).sort();

console.log('corrupt_listing_ids:');
console.log(JSON.stringify(corruptIds, null, 2));

console.log('\n--- Details of corrupt records ---');
corrupt.forEach(l => {
  console.log(`ID: ${l.listing_id} | Price: ${l.price} | BHK: ${l.bedroom} | Carpet: ${l.carpet_area} | Super: ${l.super_built_up_area} | Floor: ${l.floor}/${l.total_floors}`);
});