# Ivy Homes Software Engineering Internship Assignment

Candidate: **Mohd Aquib Ashraf**  
Email: **mohd.20233186@mnnit.ac.in**  
Live Demo: [https://ivy-assignment-kappa.vercel.app](https://ivy-assignment-kappa.vercel.app)  
Repository: [https://github.com/Aquib-Ashraf/ivy-assignment](https://github.com/Aquib-Ashraf/ivy-assignment)

---

## Overview

This repository contains my complete submission for the Ivy Homes software engineering internship assignment. The project consists of three main parts:
1. **Part 1 — Interactive Frontend Dashboard**: A single-page web application built with HTML5, Tailwind CSS, and Lucide Icons, deployed live on Vercel.
2. **Part 2 — Data Analysis & Metric Computations**: Automated Node.js scripts that process full dataset extractions (`listings.json`, `rentals.json`, `projects.json`) to compute 10 core metrics.
3. **Part 3 — API Documentation Audit**: An investigation into documentation fallacies, schema mismatches, and undocumented endpoints compiled into `findings.md` and automated inside `submission.json`.

---

## Repository Structure

```text
.
├── data/                       # Extracted JSON datasets
│   ├── listings.json           # Full offset-paged listing extractions (4,400 records)
│   ├── rentals.json            # Rental listing extractions (146 Kompally records)
│   └── projects.json           # Builder project listings
├── public/                     # Static assets served by Vercel & local server
│   ├── index.html              # Main Interactive Dashboard UI
│   ├── listings.json           # Frontend dataset copy
│   ├── rentals.json            # Frontend dataset copy
│   └── projects.json           # Frontend dataset copy
├── scripts/                    # Analysis and submission generation scripts
│   ├── pull-data.js            # Automated offset-paginated API data extractor
│   ├── find-corrupt.js         # Corrupt listing detector script
│   ├── answer-math.js          # Math & metric computation engine
│   └── generate-final-submission.js # Root submission.json generator
├── findings.md                 # Detailed API discrepancy & fallacy documentation
├── index.html                  # Root entry point for web app
├── submission.json             # Final validated submission payload
├── vercel.json                 # Vercel deployment & routing configuration
└── README.md                   # Project documentation


Part 1: Interactive Web Dashboard
- The frontend application provides a property browsing experience along with analytical tools:

- Sale Listings Explorer: Browse, search by apartment name/locality, and filter by BHKs across 4,400 listings. Flags corrupt records and live status badges.

- Property Details View: Full modal showing floor information, price per sq.ft carpet area, seller contact details, and validation error warnings.

- Rentals Explorer (Kompally Focus): Filtered view of rental properties in Kompally with aggregate rent calculations (146 records, Total Rent: ₹50,63,800/mo).

- Builder Projects Directory: Displays builder project cards with decoded min/max price ranges (converting Lakh/Crore multipliers into standard INR values).

- Saved Properties (/v1/saved): Demonstrates endpoint correction by directing saved property interactions to /v1/saved (bypassing the documented 404 /v1/favourites path).

- Data & Quality Audit Dashboard: Real-time analytical summary showcasing retrievable listings, unique property deduplication counts, corrupt record flags, and 2BHK average price rates.

Part 2: Calculated Dataset Metrics (Q1–Q10)

Q1: Total Listing Records: 4,400

Method: Extracted via full offset pagination (offset=0..4350, limit=50). Note: API header reported 4,157.

Q2: Unique Physical Properties: 4,380

Method: Grouped by locality + apartment_name + BHK + floor + area, revealing 19 duplicate listing clusters.

Q3: Active Listings Count: 3,477

Method: Filtered by is_live === true across all retrievable listing records.

Q4: Corrupt Listing IDs: 237 IDs

Method: Identified entries violating logical validation rules (e.g., negative price, 0 BHK, carpet area > super area, floor > total floors).

Q5: Total Kompally Monthly Rent: ₹50,63,800

Method: Summed price across 146 retrievable rental listings where locality is kompally.

Q6: Avg 2BHK Price / Sq.Ft: ₹17,914.95

Method: Calculated on live, non-corrupt 2BHK listings using valid carpet area values.

Q7: Costliest Builder Project: P20384

Method: Decoded numeric multipliers (price_max >= 10 = Lakhs, < 10 = Crores). Max price: ₹4.15 Cr.

Q8: Listings in Last 7 Days: 7

Method: Calculated relative to reference window end date 2026-09-10T00:00:00+05:30.

Q9: Fake Listing IDs: []

Method: Verified through candidate key validation.

Q10: Projects Wrong Count: 100

Method: Evaluated reported total_listings in projects.json against actual listing occurrences.

Part 3: API Documentation Audit & Fallacies

A full breakdown of discrepancies is logged in findings.md. Key highlights include:

1-> Pagination Undercounting: /v1/listings claims a total of 4,157 records in response meta, but offset iteration reveals 4,400 retrievable records.

2-> Endpoint Path Mismatch: Documentation lists /v1/favourites for user bookmarking, which returns 404 Not Found. The operational endpoint is /v1/saved.

3-> Unit Ambiguity in Project Prices: Project price_min and price_max fields mix Lakh and Crore scales without explicit unit indicators. Values >= 10 represent Lakhs (* 100,000), while values < 10 represent Crores (* 10,000,000).

4-> Project Listing Discrepancies: 100 builder projects report incorrect listing counts in total_listings compared to actual referencing listings in listings.json.

Setup & Local Execution
1. Installation
Clone the repository and install dependencies:

git clone [https://github.com/Aquib-Ashraf/ivy-assignment.git](https://github.com/Aquib-Ashraf/ivy-assignment.git)
cd ivy-assignment
npm install

2. Pull Data from API
Copy .env.example to .env, set your API_KEY, and run the extractor:

cp .env.example .env
npm run pull

3. Generate Final submission.json
Run the automated script to execute validation logic, parse findings.md, and format the root payload:

node scripts/generate-final-submission.js

4. Run Frontend Dashboard Locally
Serve the application locally using serve:

npx serve .

What I Checked That Turned Out Fine

- posted_at Timestamp Formatting: ISO-8601 string parsing across timezone offsets held consistent without missing timestamps.

- Rental Data Locality Consistency: Locality naming strings for kompally were clean without unexpected whitespace corruption.

- Header Authentication: The X-API-Key header requirement functioned consistently across valid endpoints.


Future Improvements

- Database Integration: Replace static JSON array loading with IndexedDB or a lightweight backend database (SQLite/PostgreSQL) for handling larger scale listings.

- Real-time WebSockets: Implement live status change updates for active vs. inactive property status transitions.

- Enhanced Data Sanitization Pipeline: Build automated edge-case flaggers into the backend API intake stream to quarantine corrupt listings prior to database ingestion.