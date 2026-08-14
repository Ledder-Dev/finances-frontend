# Graph Report - .  (2026-08-13)

## Corpus Check
- Corpus is ~13,836 words - fits in a single context window. You may not need a graph.

## Summary
- 241 nodes · 470 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.84)
- Token cost: 54,091 input · 0 output

## Community Hubs (Navigation)
- MCP/Tooling Config
- Vanilla-to-React Migration History
- Product Selector Components
- Analysis & Charting
- Build/Test Dependencies
- API Client & Debts/Settings
- Bank Sync & App State
- MCP Tool Secrets
- App Shell & Auth
- CDN Third-Party Scripts
- Design Tokens: Color/Type
- Design System Components
- API Base Port Config
- CFD Documentation Scaffold
- Design Tokens: Spacing

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 48 edges
2. `useCurrentMonth()` - 22 edges
3. `Migrate finances-frontend from vanilla JS to React 19 + Vite` - 13 edges
4. `useHeroStats()` - 10 edges
5. `useProducts()` - 8 edges
6. `useTxCategories()` - 8 edges
7. `mcp` - 7 edges
8. `useAuth()` - 7 edges
9. `CategorySelect()` - 7 edges
10. `ReceiptForm()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `<script type=module src=/src/main.jsx> entry point` --references--> `Migrate finances-frontend from vanilla JS to React 19 + Vite`  [INFERRED]
  index.html → docs/adr/005-migracion-vanilla-a-react.md
- `Chart.js CDN script tag` --conceptually_related_to--> `Chart.js and Plaid Link loaded via CDN`  [INFERRED]
  index.html → docs/adr/001-import-baseline.md
- `Plaid Link CDN script tag` --conceptually_related_to--> `Chart.js and Plaid Link loaded via CDN`  [INFERRED]
  index.html → docs/adr/001-import-baseline.md
- `Alternative considered: React/Vue + component bundler (rejected)` --semantically_similar_to--> `Migrate finances-frontend from vanilla JS to React 19 + Vite`  [INFERRED] [semantically similar]
  docs/adr/002-modularizacion-es-modules.md → docs/adr/005-migracion-vanilla-a-react.md
- `Color palette (--color-primary, --color-bg, --color-text, --color-muted, --color-danger)` --shares_data_with--> `styles.css stylesheet link`  [INFERRED]
  docs/design-system.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend architecture evolution: baseline import to modularization to React** — docs_adr_001_import_baseline_decision, docs_adr_002_modularizacion_es_modules_decision, docs_adr_005_migracion_vanilla_a_react_decision [INFERRED 0.85]
- **Auth flow evolution: JWT localStorage bearer to cookie session** — docs_adr_001_import_baseline_auth_jwt_localstorage, docs_adr_004_auth_cookie_session_decision, docs_adr_004_auth_cookie_session_apifetch [INFERRED 0.85]
- **React migration guiding principles (no Redux, no router, domain-by-domain cutover)** — docs_adr_005_migracion_vanilla_a_react_context_api, docs_adr_005_migracion_vanilla_a_react_no_router, docs_adr_005_migracion_vanilla_a_react_domain_by_domain [INFERRED 0.75]

## Communities (17 total, 4 thin omitted)

### Community 0 - "MCP/Tooling Config"
Cohesion: 0.07
Nodes (34): command, type, PAGESPEED_API_KEY, UMAMI_PASSWORD, UMAMI_URL, UMAMI_USERNAME, type, url (+26 more)

### Community 1 - "Vanilla-to-React Migration History"
Cohesion: 0.07
Nodes (33): public/app.js monolith (~2080 lines), Auth JWT bearer token in localStorage, Import baseline as-is, no source changes, finances-backend (original monolith), Alternative considered: migrate inline handlers to addEventListener (rejected for now), Alternative considered: React/Vue + component bundler (rejected), Split app.js into native ES modules under src/, Inline onclick/onchange/oninput handlers exposed on window (+25 more)

### Community 2 - "Product Selector Components"
Cohesion: 0.13
Nodes (17): CategorySelect(), ProductTypeSelect(), products, UnitSelect(), findProduct(), ProductList(), ProductRow(), PurchaseForm() (+9 more)

### Community 3 - "Analysis & Charting"
Cohesion: 0.15
Nodes (17): AnalysisTab(), baseOpts, CHART_SPECS, trimmedMean(), TAB_IDS, TabNav(), TABS, HeroBanner() (+9 more)

### Community 4 - "Build/Test Dependencies"
Cohesion: 0.08
Nodes (25): jsdom, dependencies, react, react-dom, devDependencies, jsdom, @testing-library/jest-dom, @testing-library/react (+17 more)

### Community 5 - "API Client & Debts/Settings"
Cohesion: 0.17
Nodes (13): API_BASE, apiFetch(), SettingsModal(), DebtsTab(), jsonRes(), openDebt, renderTab(), ReceiptGroup() (+5 more)

### Community 6 - "Bank Sync & App State"
Cohesion: 0.17
Nodes (16): BankTab(), isCredit(), SUBTYPE_LABEL, categoriesFor(), TellerReviewCard(), AppStateContext, AppStateProvider(), defaultMonth() (+8 more)

### Community 7 - "MCP Tool Secrets"
Cohesion: 0.16
Nodes (14): PAGESPEED_API_KEY, UMAMI_PASSWORD, UMAMI_URL, UMAMI_USERNAME, npx, chrome-devtools, glitchtip, pagespeed (+6 more)

### Community 8 - "App Shell & Auth"
Cohesion: 0.38
Nodes (7): setUnauthorizedHandler(), App(), AuthContext, AuthProvider(), useAuth(), AuthGate(), Layout()

### Community 9 - "CDN Third-Party Scripts"
Cohesion: 0.67
Nodes (3): Chart.js and Plaid Link loaded via CDN, Chart.js CDN script tag, Plaid Link CDN script tag

### Community 10 - "Design Tokens: Color/Type"
Cohesion: 0.67
Nodes (3): Color palette (--color-primary, --color-bg, --color-text, --color-muted, --color-danger), Typography (system font, 13-14px base), styles.css stylesheet link

## Knowledge Gaps
- **74 isolated node(s):** `semgrep`, `glitchtip`, `@mikusnuz/umami-mcp`, `UMAMI_URL`, `UMAMI_USERNAME` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `API Client & Debts/Settings` to `App Shell & Auth`, `Product Selector Components`, `Analysis & Charting`, `Bank Sync & App State`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `useCurrentMonth()` connect `Analysis & Charting` to `App Shell & Auth`, `Product Selector Components`, `API Client & Debts/Settings`, `Bank Sync & App State`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Migrate finances-frontend from vanilla JS to React 19 + Vite` (e.g. with `Alternative considered: React/Vue + component bundler (rejected)` and `Finance Tracker identity (personal/family, minimalist)`) actually correct?**
  _`Migrate finances-frontend from vanilla JS to React 19 + Vite` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `semgrep`, `glitchtip`, `@mikusnuz/umami-mcp` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MCP/Tooling Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06722689075630252 - nodes in this community are weakly interconnected._
- **Should `Vanilla-to-React Migration History` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `Product Selector Components` be split into smaller, more focused modules?**
  _Cohesion score 0.13446969696969696 - nodes in this community are weakly interconnected._