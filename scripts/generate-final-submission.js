import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadData(filename) {
  const possiblePaths = [
    path.join(__dirname, '../data', filename),
    path.join(__dirname, '..', filename)
  ];
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8'));
    }
  }
  throw new Error(`Could not find ${filename}`);
}

// 1. Load Dataset
const listings = loadData('listings.json');
const rentals = loadData('rentals.json');
const projects = loadData('projects.json');

// 2. Parse findings.md into JSON array
const findingsMdPath = path.join(__dirname, '../findings.md');
let findings = [];

if (existsSync(findingsMdPath)) {
  const mdContent = readFileSync(findingsMdPath, 'utf8');
  const sections = mdContent.split(/##\s+\d+\.\s+/).slice(1);
  
  findings = sections.map(section => {
    const getVal = (label) => {
      const match = section.match(new RegExp(`\\*\\*${label}\\*\\*:\\s*(.+)`));
      return match ? match[1].trim().replace(/^["`]|["`]$/g, '') : '';
    };

    return {
      endpoint: getVal('endpoint') || '*',
      category: getVal('category') || 'other',
      documented: getVal('documented'),
      actual: getVal('actual'),
      how_found: getVal('how_found'),
      impact: getVal('impact'),
      evidence: []
    };
  });
}

// 3. Compute Answers (Q1 to Q10)
const corruptListings = listings.filter(l => {
  const invalidPrice = l.price !== undefined && l.price <= 0;
  const invalidBedroom = l.bedroom !== undefined && l.bedroom <= 0;
  const invalidBathroom = l.bathroom !== undefined && l.bathroom < 0;
  const invalidCarpetArea = l.carpet_area !== undefined && l.carpet_area <= 0;
  const invalidSuperArea = l.super_built_up_area !== undefined && l.super_built_up_area <= 0;
  const carpetExceedsSuper = (l.carpet_area && l.super_built_up_area) ? l.carpet_area > l.super_built_up_area : false;
  const floorExceedsTotal = (l.floor !== undefined && l.total_floors !== undefined) ? l.floor > l.total_floors : false;
  return invalidPrice || invalidBedroom || invalidBathroom || invalidCarpetArea || invalidSuperArea || carpetExceedsSuper || floorExceedsTotal;
});
const corruptIds = corruptListings.map(l => l.listing_id).sort();

const propGroups = new Map();
listings.forEach(l => {
  const apartment = (l.apartment_name || '').trim().toLowerCase();
  const locality = (l.locality || '').trim().toLowerCase();
  const bhk = l.bedroom || 0;
  const floor = l.floor || 0;
  const area = l.carpet_area || l.super_built_up_area || 0;
  const key = `${locality}|${apartment}|${bhk}|${floor}|${area}`;
  propGroups.set(key, true);
});

const targetLocality = "kompally";
const kompallyRentals = rentals.filter(r => (r.locality || '').trim().toLowerCase() === targetLocality);
const totalRent = kompallyRentals.reduce((sum, r) => sum + Number(r.price || 0), 0);

const corruptSet = new Set(corruptIds);
const valid2BhkLive = listings.filter(l => 
  l.is_live === true && 
  l.bedroom === 2 && 
  !corruptSet.has(l.listing_id) && 
  l.price > 0 && 
  l.carpet_area > 0
);
const rates = valid2BhkLive.map(l => l.price / l.carpet_area);
const avgRate = Number((rates.reduce((acc, r) => acc + r, 0) / rates.length).toFixed(2));

function decodeProjectPrice(v) {
  if (!v) return 0;
  const num = Number(v);
  if (num >= 10) return Math.round(num * 100000);
  return Math.round(num * 10000000);
}
let costliest = { project_id: "", price_max_inr: 0 };
projects.forEach(p => {
  const maxInr = decodeProjectPrice(p.price_max);
  if (maxInr > costliest.price_max_inr) {
    costliest = { project_id: p.project_id, price_max_inr: maxInr };
  }
});

const refEnd = new Date("2026-09-10T00:00:00+05:30").getTime();
const refStart = refEnd - (7 * 24 * 60 * 60 * 1000);
const last7Days = listings.filter(l => {
  if (!l.posted_at) return false;
  const tsStr = l.posted_at.endsWith('Z') || l.posted_at.includes('+') ? l.posted_at : `${l.posted_at}+05:30`;
  const t = new Date(tsStr).getTime();
  return t >= refStart && t < refEnd;
}).length;

const actualCounts = new Map();
listings.forEach(l => {
  if (l.project_id) actualCounts.set(l.project_id, (actualCounts.get(l.project_id) || 0) + 1);
});
let wrongCountProjects = 0;
projects.forEach(p => {
  if ((p.total_listings || 0) !== (actualCounts.get(p.project_id) || 0)) wrongCountProjects++;
});

// Build submission object
const submission = {
  "api_key": "YOUR_API_KEY_HERE",
  "candidate": {
    "name": "Aquib Ashraf",
    "email": "you@mnnit.ac.in",
    "repo_url": "https://github.com/Aquib-Ashraf/ivy-assignment",
    "demo_url": "https://your-app.vercel.app"
  },
  "answers": {
    "total_listing_records": listings.length,
    "unique_properties": propGroups.size,
    "active_listings": listings.filter(l => l.is_live === true).length,
    "corrupt_listing_ids": corruptIds,
    "total_monthly_rent": totalRent,
    "avg_price_per_sqft_2bhk": avgRate,
    "costliest_project": costliest,
    "listings_last_7_days": last7Days,
    "fake_listing_ids": [],
    "projects_with_wrong_listing_count": wrongCountProjects
  },
  "findings": findings
};

const outputPath = path.join(__dirname, '../submission.json');
writeFileSync(outputPath, JSON.stringify(submission, null, 2));
console.log(`Generated root submission.json successfully from findings.md!`);