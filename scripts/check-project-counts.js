import { readFileSync } from 'fs';

const listings = JSON.parse(readFileSync(new URL('../data/listings.json', import.meta.url)));
const projects = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url)));

console.log('=== Checking Q10: Projects with Wrong Listing Count ===');

// Count actual listings per project_id
const actualCounts = new Map();
listings.forEach(l => {
  if (l.project_id) {
    actualCounts.set(l.project_id, (actualCounts.get(l.project_id) || 0) + 1);
  }
});

let wrongCountProjects = 0;
const mismatchedProjects = [];

projects.forEach(p => {
  const reported = p.total_listings || 0;
  const actual = actualCounts.get(p.project_id) || 0;

  if (reported !== actual) {
    wrongCountProjects++;
    mismatchedProjects.push({
      project_id: p.project_id,
      reported,
      actual
    });
  }
});

console.log(`Total projects: ${projects.length}`);
console.log(`projects_with_wrong_listing_count: ${wrongCountProjects}\n`);
console.log('Sample mismatched projects (first 10):', mismatchedProjects.slice(0, 10));