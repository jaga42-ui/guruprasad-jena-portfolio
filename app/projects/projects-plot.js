/* plotter copy — generated from projects-data.json */
export const PROJECTS = [
 {
  "n": "01",
  "name": "Umbrix",
  "slug": "UMBRIX.DWG",
  "tag": "Jobs pulled straight from the source, tailored to you.",
  "status": "LIVE",
  "live": "https://www.umbrix.in/",
  "repo": "",
  "shipped": "2026",
  "repoNote": "Source private — provider keys and the scam-filter rules ship with it. Walkthrough on request.",
  "accent": "#ef8a4a",
  "summary": "An installable job platform for Indian freshers: listings are polled from four public ATS APIs — Greenhouse, Lever, Ashby and SmartRecruiters — plus the Adzuna aggregator across 18 India shards, scam-scored before they are stored, and every application is tailored to the role by a resume parser and a Groq-backed tailoring engine.",
  "failed": "Scraping listing pages. Every layout change broke the parser, duplicates piled up across sources, and I was storing junk that a student would have to sift through. Sending raw resume text straight to the model was just as bad — it hallucinated experience that was never there.",
  "changed": "I moved to provider APIs with a scheduled job per source, so listings are structured on arrival and the scam filter runs before the insert rather than after. The tailoring engine now receives parsed, structured resume fields and the job’s own requirements — it rewrites emphasis, it does not invent history.",
  "learned": "The boring layer is where the trust lives. A filter that runs before the write, and a parser that hands the model structure instead of prose, did more for output quality than any prompt I tried.",
  "rebuild": "A queue in front of the ingestion job so one slow provider cannot stall the run, and per-source dedupe keyed on company plus title rather than provider id.",
  "stats": [
   [
    "160",
    "companies polled by API"
   ],
   [
    "0",
    "listings scraped from pages"
   ],
   [
    "11,500",
    "postings the filter was tested on"
   ]
  ],
  "decisions": [
   [
    "APIS, NOT SCRAPERS",
    "Greenhouse, Lever, Ashby and SmartRecruiters return structured listings, with Adzuna across 18 India shards. A layout change can no longer break ingestion."
   ],
   [
    "FILTER BEFORE WRITE",
    "The scam filter sits between the cron and the database, so a bad listing never reaches a student."
   ],
   [
    "PARSE, THEN TAILOR",
    "The resume parser hands the model structured fields, which is what stops it inventing experience."
   ],
   [
    "APPLY AT THE SOURCE",
    "Every card links out to the company's own careers page. Umbrix never sits between the applicant and the employer."
   ]
  ],
  "timeline": [
   [
    "Step 01",
    "Provider integrations: four ATS boards plus Adzuna"
   ],
   [
    "Step 02",
    "Scheduled ingestion with the filter before insert"
   ],
   [
    "Step 03",
    "Resume parser into structured fields"
   ],
   [
    "Step 04",
    "Groq tailoring engine against job requirements"
   ],
   [
    "Step 05",
    "Match scoring out of 99, with its working shown"
   ]
  ],
  "nodes": [
   "Job seeker",
   "Installable PWA",
   "API layer",
   "Database",
   "ATS APIs · Adzuna",
   "Cron job",
   "Scam filter"
  ],
  "subs": [
   "fresher · india feed",
   "next.js on vercel",
   "auth · routing · quotas",
   "listings · profiles · applications",
   "four boards + one aggregator",
   "one job per source",
   "runs before the insert"
  ],
  "sides": [
   "Resume parser",
   "Match scoring",
   "Tailoring engine",
   "Groq"
  ],
  "sideSubs": [
   "cv → structured fields",
   "score out of 99",
   "per-role rewrite",
   "llama inference"
  ],
  "wires": [
   "pwa install",
   "pwa → api",
   "api → db",
   "pull · schedule",
   "raw listings",
   "insert"
  ],
  "stack": [
   "Next.js",
   "React",
   "TypeScript",
   "Tailwind CSS",
   "PWA",
   "Node.js",
   "Groq",
   "Greenhouse API",
   "Lever API",
   "Ashby API",
   "SmartRecruiters API",
   "Adzuna API",
   "Cron",
   "Vercel"
  ]
 },
 {
  "n": "02",
  "name": "GetFreeToolsAI",
  "slug": "GETFREETOOLSAI.DWG",
  "tag": "Free tools that never upload your files.",
  "status": "LIVE",
  "live": "https://www.getfreetoolsai.com/",
  "repo": "",
  "shipped": "2026",
  "repoNote": "Source private — service keys and abuse limits ship with it. Walkthrough on request.",
  "accent": "#6fc4b8",
  "summary": "140+ PDF, image, calculator, text and developer tools, each running entirely inside the browser tab — no signup, no watermark, no daily limit, and nothing ever sent to a server.",
  "failed": "Loading every engine up front. The first build shipped megabytes of WASM to someone who only wanted to rotate one page, and a mid-range phone ran out of memory on a large PDF.",
  "changed": "Each tool is its own focused page that lazy-loads only the core it needs, heavy work moved off the main thread, and every tool is a single drop zone with one big download button.",
  "learned": "Bundle size is user experience. Local-first isn’t a constraint — it’s the reason there is no upload to intercept and no file-size cap to enforce.",
  "rebuild": "A shared results cache and a batch queue, so running the same conversion across fifty files feels like one action instead of fifty.",
  "stats": [
   [
    "130",
    "tools and counting"
   ],
   [
    "0",
    "files uploaded"
   ],
   [
    "43",
    "calculators alone"
   ]
  ],
  "decisions": [
   [
    "NO SERVER IN THE LOOP",
    "If the file never leaves the tab, there is nothing to leak, log or delete."
   ],
   [
    "ONE TOOL, ONE PAGE",
    "Each tool is a focused app with a drop zone and a download button — not a menu."
   ],
   [
    "LAZY EVERYTHING",
    "Engines load per tool, so a calculator never pays for the OCR core."
   ],
   [
    "NO DARK PATTERNS",
    "No watermark, no daily cap, no account. The free version is the whole product."
   ]
  ],
  "timeline": [
   [
    "Step 01",
    "Audit of what people actually search for"
   ],
   [
    "Step 02",
    "First six tools, browser-only, no build tricks"
   ],
   [
    "Step 03",
    "WASM engines behind workers"
   ],
   [
    "Step 04",
    "Perf pass: lazy cores, memory ceilings"
   ],
   [
    "Step 05",
    "Scale to 140+ across seven categories"
   ]
  ],
  "nodes": [
   "Browser",
   "Worker",
   "WASM Engines",
   "Download"
  ],
  "subs": [
   "one page per tool",
   "off main thread",
   "pdf · image · ocr",
   "never uploaded"
  ],
  "sides": [
   "Lazy Cores",
   "Guides"
  ],
  "sideSubs": [
   "fetched on demand",
   "how-tos + compare"
  ],
  "wires": [
   "user → worker",
   "router → engines",
   "result → user"
  ],
  "stack": [
   "Next.js App Router",
   "React",
   "TypeScript",
   "Tailwind CSS",
   "Service Worker",
   "WebAssembly",
   "Web Workers",
   "pdf-lib",
   "Canvas API",
   "Vitest",
   "GitHub Actions",
   "Vercel Analytics",
   "Clarity",
   "Vercel"
  ]
 },
 {
  "n": "03",
  "name": "Veritas Picks",
  "slug": "VERITASPICKS.DWG",
  "tag": "An editorial magazine that happens to be static.",
  "status": "LIVE",
  "live": "https://veritas-picks.vercel.app/",
  "repo": "https://github.com/jaga42-ui/veritas-picks",
  "shipped": "2026",
  "accent": "#b98be0",
  "summary": "A curated discovery platform: eighteen lifestyle categories of editorial guides authored in MDX, rendered as static pages with structured product data, pin metadata, search and its own feed.",
  "failed": "Fetching products on the client. Nothing was indexable, every card flashed a skeleton, and one bad response emptied a page that should never have been dynamic.",
  "changed": "Everything derives at build time — headings become the table of contents, reading time is computed, pin titles and descriptions fall back to generated variants, and robots, sitemap and the RSS feed are generated routes.",
  "learned": "Typed frontmatter is a schema. Once ProductItem existed, the card, the comparison table and the FAQ block could each be written once and trusted everywhere.",
  "rebuild": "A small editor UI over the same frontmatter shape, so a non-technical curator can publish without ever opening an MDX file.",
  "stats": [
   [
    "18",
    "curated categories"
   ],
   [
    "5",
    "pin variants per guide"
   ],
   [
    "0",
    "client-side data fetches"
   ]
  ],
  "decisions": [
   [
    "CONTENT AS FILES",
    "No CMS. A guide is reviewable, revertable and diffable like code."
   ],
   [
    "SCHEMA FIRST",
    "ProductItem and BuyingGuideFrontmatter are the contract every component reads."
   ],
   [
    "DERIVE, DON’T STORE",
    "Reading time, headings and pin copy are computed, never hand-maintained."
   ],
   [
    "DISCLOSE UP FRONT",
    "Affiliate disclosure and editorial ethics are real pages, not footer fine print."
   ]
  ],
  "timeline": [
   [
    "Step 01",
    "Frontmatter schema for guides and products"
   ],
   [
    "Step 02",
    "Content layer: parse, derive, sort"
   ],
   [
    "Step 03",
    "Editorial cards, comparison tables, FAQs"
   ],
   [
    "Step 04",
    "Pinterest metadata and share pipeline"
   ],
   [
    "Step 05",
    "robots, sitemap, RSS and category routes"
   ]
  ],
  "nodes": [
   "MDX Guides",
   "Content Layer",
   "Next 16",
   "Routes"
  ],
  "subs": [
   "typed frontmatter",
   "parse + derive",
   "static render",
   "sitemap · feed"
  ],
  "sides": [
   "Pin Metadata",
   "Search"
  ],
  "sideSubs": [
   "rich-pin attrs",
   "client index · ⌘K"
  ],
  "wires": [
   "read",
   "derive",
   "emit"
  ],
  "stack": [
   "Next 16",
   "React 19",
   "TypeScript",
   "Tailwind v4",
   "MDX",
   "gray-matter",
   "Framer Motion",
   "lucide-react"
  ]
 },
 {
  "n": "04",
  "name": "Sahayam",
  "slug": "SAHAYAM.DWG",
  "tag": "Find a blood donor, closer than you think.",
  "status": "LIVE",
  "live": "https://sahayam-beta.vercel.app/",
  "repo": "https://github.com/jaga42-ui/Sahayam",
  "shipped": "2026",
  "accent": "#ef6a5a",
  "summary": "A real-time network that turns a blood emergency into targeted alerts — only compatible, eligible donors nearby get pinged, and the search widens on a timer until enough of them confirm.",
  "failed": "The first version blasted everyone in the city and let two people accept the same slot. Both showed up. Neither was needed.",
  "changed": "A $geoNear aggregation returns donors pre-sorted by distance, an atomic claim gives exactly one winner (everyone else gets a clean 409), and alerts fan out over push and email — for a life-critical message, receiving both is the safe failure mode.",
  "learned": "An index is a design decision, not an optimisation you bolt on later. And a distributed CronLock is what stops two instances escalating the same SOS twice.",
  "rebuild": "Redis for Socket.io state and distributed rate limiting, BullMQ instead of a single-instance cron, and an SMS fallback for donors without reliable push.",
  "stats": [
   [
    "409",
    "on a duplicate accept"
   ],
   [
    "90",
    "day cooldown enforced"
   ],
   [
    "200",
    "donors in the seeded demo"
   ]
  ],
  "decisions": [
   [
    "ONE MATCHING PATH",
    "Radar, blast and cron all call donorMatching.js — no second implementation to drift."
   ],
   [
    "COMPAT AS DATA",
    "bloodCompat.js holds the donor/recipient matrix and is unit tested, not inlined in a route."
   ],
   [
    "AT-LEAST-ONCE",
    "Push and email both fire. Duplicate alerts beat a missed one."
   ],
   [
    "OBSERVABLE",
    "engine-metrics reports fill rate, median time-to-first-response and escalation depth."
   ]
  ],
  "timeline": [
   [
    "Step 01",
    "Donor model, blood-group matrix, unit tests"
   ],
   [
    "Step 02",
    "Geo radar with $geoNear and real distances"
   ],
   [
    "Step 03",
    "Atomic claim + push/email fan-out"
   ],
   [
    "Step 04",
    "Timeout-driven escalation behind a CronLock"
   ],
   [
    "Step 05",
    "Admin command centre and engine metrics"
   ]
  ],
  "nodes": [
   "React SPA",
   "Express API",
   "Match Engine",
   "MongoDB"
  ],
  "subs": [
   "maps · chat",
   "JWT · logic",
   "$geoNear · compat",
   "geo + TTL"
  ],
  "sides": [
   "node-cron",
   "Gemini AI"
  ],
  "sideSubs": [
   "widens the radius",
   "triage from prose"
  ],
  "wires": [
   "REST + WS",
   "candidates",
   "$geoNear"
  ],
  "stack": [
   "React 19",
   "Vite",
   "Tailwind v4",
   "Node.js",
   "Express",
   "MongoDB",
   "Socket.io",
   "Leaflet",
   "Gemini",
   "Cloudinary",
   "Helmet",
   "JWT"
  ]
 }
];
export default PROJECTS;
