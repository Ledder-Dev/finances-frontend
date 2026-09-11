# Estado actual — finances-frontend

> Detalle referenciado desde `CLAUDE.md`. Fuente de verdad de tareas: `TASKS.md`.

## Migración React (ADR 005) — completada

Migración vanilla JS → React 19 terminada (task 034, cutover). `src/*.js` sueltos
viejos eliminados, `index.html` es el único entry point (ya no hay `react-app.html`
multi-page), `vite.config.js` de vuelta a config simple. Sin reescritura de diseño
(mismo `public/styles.css`), Context API + hooks (sin Redux), sin router.

**Dominios portados (018-032, done):** scaffold, auth context, state global,
UI helpers compartidos, layout + tabs, Products/Purchases, Transactions,
Receipts, Recurring/Fixed items, Family Bank (Plaid), Savings, Debts,
Settings, Dashboard Analysis + Hero, Tests.

**033 (QA manual end-to-end) saltada deliberadamente** — decisión del usuario,
riesgo aceptado, cutover (034) procedió sin ese paso. Sin herramienta de browser
en este entorno — ningún dominio probado con render real todavía; primer smoke
test en navegador real queda pendiente para cuando el usuario lo corra.

Cada task done en `TASKS.md` documenta gaps cross-dominio dejados a propósito
(YAGNI) — ej. `BankTab` no dispara `loadSavings()` tras sync manual. Revisar
la entrada de cada task en `TASKS.md` para el detalle completo.

**Merge a `develop`/`master` explícitamente NO hecho** — instrucción del usuario.
Rama de trabajo activa: `develop` (`devRandy` eliminada local+remota, sin commits propios pendientes).

## Tab Compare (2026-09-06)

Gap de #031 cerrado: `src/products/CompareTab.jsx` compara productos por precio
(mejor precio agrupado por `product_type`, normalizado a unidad base cuando aplica
Oz/Lb). Ver detalle en `TASKS.md` #037.

**Verificación en cutover:** `npm run build` + `npm test -- --run`.

## Fuera de la migración React (histórico, ver `TASKS.md` sección done)

- Ops: repo en `Ledder-Dev/finances-frontend`, deploy vía Cloudflare Pages (ver `README.md`), cierra #011.
- Auth: sesión por cookie (Better-Auth), ver `docs/adr/004-auth-cookie-session.md`.
- Backend: `finances-api` puerto 3001/3002 según entorno, contrato compartido en
  `_shared/contracts/finances/api-contract.yaml`.

Ver `docs/adr/001-import-baseline.md` para el baseline pre-modularización.
