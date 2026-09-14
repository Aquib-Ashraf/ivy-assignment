import { readFileSync } from 'fs';
const projects = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url)));

console.log('=== Sample of 8 projects: price_min / price_max / min_area_sqft / max_area_sqft ===');
console.log(JSON.stringify(
  projects.slice(0, 8).map(p => ({
    project_id: p.project_id,
    price_min: p.price_min,
    price_max: p.price_max,
    min_area_sqft: p.min_area_sqft,
    max_area_sqft: p.max_area_sqft,
  })),
  null, 2
));

console.log('\n=== Distribution check: how many projects have price_max < 1000 (suspiciously small if rupees)? ===');
console.log(projects.filter(p => p.price_max < 1000).length, 'out of', projects.length);

console.log('\n=== How many have price_max > 1000000 (looks like real rupees already)? ===');
console.log(projects.filter(p => p.price_max > 1000000).length, 'out of', projects.length);

console.log('\n=== Min and max of price_max across all projects ===');
const maxes = projects.map(p => p.price_max).filter(v => typeof v === 'number');
console.log('min:', Math.min(...maxes), 'max:', Math.max(...maxes));
