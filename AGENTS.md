# finances-frontend — Contexto del proyecto

## Qué es este proyecto
SPA vanilla JS, consume API de `finances-backend`. Gestiona finanzas personales/familiares: compras, recibos con OCR, ingresos, gastos, ahorros, deudas, remesas familiares, sync bancario vía Plaid.

## Antes de empezar
Lee este archivo completo. Después: `docs/` y ADRs en `docs/adr/`.

## Stack
Vanilla JS (ES6+) + HTML + CSS, sin framework UI. Vite 6 solo pa dev server/build. Chart.js y Plaid Link vía CDN, sin npm. Auth JWT en `localStorage`. Detalle en `.claude/ARCHITECTURE.md`.

## Convenciones específicas
- Reglas globales del universo (CLAUDE.md, raíz de ai-os).
- ADRs en `docs/adr/NNN-titulo.md` pa decisiones técnicas del proyecto.
- Patterns reutilizables → `/learn` pa añadir al universo.

## Estado actual
Ver `TASKS.md` (carril doing) y `CURRENT_STATUS.md`.

## Subagentes recomendados para este proyecto
- @build (default) — desarrollo general
- @architect — decisión de diseño
- @code-reviewer — antes de cualquier PR