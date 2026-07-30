import './api.js'; // installs the window.fetch override (auth header injection, 401 handling)
import * as auth from './auth.js';
import * as core from './core.js';
import * as receipts from './receipts.js';
import * as savings from './savings.js';
import * as debts from './debts.js';
import * as analysis from './analysis.js';
import * as familyBank from './family-bank.js';
import * as settings from './settings.js';

// index.html still relies on inline onclick/oninput/onchange handlers (some of
// them generated dynamically via innerHTML templates) — expose every domain
// function on window so those handlers keep resolving after the ES module split.
Object.assign(window, auth, core, receipts, savings, debts, analysis, familyBank, settings);

auth.init();
