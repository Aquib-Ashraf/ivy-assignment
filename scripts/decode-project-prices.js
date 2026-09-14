import { readFileSync } from 'fs';
const projects = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url)));

const LAKH = 100000;
const CRORE = 10000000;
const PLAUSIBLE_MIN = 1000000;   // 10 Lakh
const PLAUSIBLE_MAX = 200000000; // 20 Crore

// Returns the real rupee value, or null if genuinely ambiguous/implausible either way.
function decode(v) {
  if (v === null || v === undefined) return { value: null, note: 'missing' };
  const asLakh = v * LAKH;
  const asCrore = v * CRORE;
  const lakhOk = asLakh >= PLAUSIBLE_MIN && asLakh <= PLAUSIBLE_MAX;
  const croreOk = asCrore >= PLAUSIBLE_MIN && asCrore <= PLAUSIBLE_MAX;
  if (lakhOk && !croreOk) return { value: asLakh, note: 'lakh' };
  if (croreOk && !lakhOk) return { value: asCrore, note: 'crore' };
  if (lakhOk && croreOk) return { value: asLakh, note: 'AMBIGUOUS-both-plausible, defaulted to lakh' };
  return { value: null, note: 'NEITHER plausible' };
}

let ambiguousCount = 0;
let neitherCount = 0;

const decoded = projects.map(p => {
  const min = decode(p.price_min);
  const max = decode(p.price_max);
  if (min.note.startsWith('AMBIGUOUS') || max.note.startsWith('AMBIGUOUS')) ambiguousCount++;
  if (min.note === 'NEITHER plausible' || max.note === 'NEITHER plausible') neitherCount++;
  return {
    project_id: p.project_id,
    raw_price_min: p.price_min,
    raw_price_max: p.price_max,
    decoded_price_min: min.value,
    decoded_price_max: max.value,
    min_note: min.note,
    max_note: max.note,
  };
});

console.log('Ambiguous records (both interpretations plausible):', ambiguousCount);
console.log('Neither-plausible records (heuristic totally fails):', neitherCount);

console.log('\n=== Sample of decoded values (first 8) ===');
console.log(JSON.stringify(decoded.slice(0, 8), null, 2));

console.log('\n=== Q7 costliest_project, using DECODED price_max ===');
const costliest = decoded.reduce((max, p) =>
  (p.decoded_price_max === null) ? max :
  (!max || p.decoded_price_max > max.decoded_price_max) ? p : max
, null);
console.log(JSON.stringify({ project_id: costliest.project_id, price_max_inr: Math.round(costliest.decoded_price_max) }, null, 2));

console.log('\n=== Any records where decoded max < decoded min (still inconsistent after decoding)? ===');
const stillBroken = decoded.filter(p => p.decoded_price_min !== null && p.decoded_price_max !== null && p.decoded_price_max < p.decoded_price_min);
console.log('count:', stillBroken.length);
console.log(JSON.stringify(stillBroken.slice(0, 10), null, 2));
