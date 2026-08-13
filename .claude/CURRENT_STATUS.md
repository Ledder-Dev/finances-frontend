# Estado actual — finances-frontend

> Detalle referenciado desde `CLAUDE.md`. Fuente de verdad de tareas: `TASKS.md`.

## Migración React (ADR 005)

Branch `feature/react-migration`, coexiste con vanilla (`index.html`) via multi-page Vite
(`react-app.html`). Cutover único al final (task 034), sin reescritura de diseño
(mismo `public/styles.css`), Context API + hooks (sin Redux), sin router.

**Dominios portados (018-028, done):** scaffold, auth context, state global,
UI helpers compartidos, layout + tabs, Products/Purchases, Transactions,
Receipts, Recurring/Fixed items, Family Bank (Plaid), Savings.

**Pendiente (backlog):**
- 029 — Debts (`src/debts.js` + card "Add debt" del `tab-savings`)
- 030 — Settings (modal, background image)
- 031 — Dashboard Analysis + Hero (decidir `react-chartjs-2` vs ref imperativo)
- 032 — Tests (porta 17 tests vanilla + React Testing Library)
- 033 — QA manual end-to-end (11 dominios, navegador real)
- 034 — Cutover (elimina vanilla, merge a `develop`)

Cada task done en `TASKS.md` documenta gaps cross-dominio dejados a propósito
(YAGNI) — ej. `BankTab` no dispara `loadSavings()` tras sync manual,
`heroStats` tiene slots sin consumidor hasta 031. Revisar la entrada de cada
task en `TASKS.md` para el detalle completo antes de retomar un dominio.

**Verificación en cada task:** `npm run build` + `npm test -- --run` limpios
(2 fallos preexistentes en `api.test.js` por mismatch de puerto en
`.env.local`, no relacionados). Sin herramienta de browser en este entorno —
ningún dominio React probado con render real todavía. QA manual (033) cubre eso.

## Fuera de la migración React (histórico, ver `TASKS.md` sección done)

- Ops: repo migrado a `Ledder-Dev/finances-frontend`, deploy pendiente de definir (#011).
- Auth: sesión por cookie (Better-Auth), ver `docs/adr/004-auth-cookie-session.md`.
- Backend: `finances-api` puerto 3001/3002 según entorno, contrato compartido en
  `_shared/contracts/finances/api-contract.yaml`.

Ver `docs/adr/001-import-baseline.md` para el baseline pre-modularización.
