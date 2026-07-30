# ADR 001 — Import baseline de finances-frontend

## Estado
Aceptado

## Fecha
2026-07-29

## Contexto
`finances-frontend` existía como proyecto standalone, resultado de partir el
monolito original de `finances-backend` en frontend/backend separados (ver
commit `089f134 Split frontend from monolith`), ya en uso funcional antes de
que el universo o la metodología CFD existieran. Se decidió importarlo a
`worlds/finances-frontend` pa que herede convenciones, telemetría de tokens,
skills y el resto de infraestructura compartida del universo.

## Decisión
Importar el proyecto tal cual, sin modificar código fuente, y generar sobre
él el scaffold CFD completo (CLAUDE.md, TASKS.md, AGENTS.md, COWORK.md, docs/,
`.claude/`) documentando la arquitectura y convenciones **tal como se
encontraron**, no como se rediseñarían desde cero.

## Arquitectura encontrada (baseline, no inventada)
- Vanilla JS + HTML + CSS, sin framework de UI ni bundler de componentes.
- Vite 6 solo pa dev server (`npm run dev`) y build (`npm run build`) —
  `vite.config.js` mínimo, solo `server.host = true`.
- Un solo archivo `public/app.js` (~2080 líneas) con toda la lógica: auth,
  fetch de las 8 pestañas (Purchases, Transactions, Products, Compare,
  Savings, Analysis, Family, Bank Sync), sin separación en módulos.
- `API_BASE` hardcodeado a puerto 3001, detecta host vía
  `window.location.hostname` (soporta localhost y LAN, no dominio propio).
- Auth JWT: token en `localStorage`, `window.fetch` global sobreescrito pa
  inyectar `Authorization: Bearer` en toda request a `/api/*` y forzar logout
  en 401.
- Chart.js y Plaid Link cargados vía CDN (`<script src="https://...">`),
  no como dependencias npm.
- Sin `README.md` previo — se creó uno mínimo en este import.
- Sin tests automatizados.

## Consecuencias
- El scaffold CFD documenta esta arquitectura como está, no como debería
  ser — cualquier refactor (modularizar `app.js`, agregar tests, mover
  Chart.js/Plaid a npm) queda registrado como tarea en `TASKS.md`, no se
  ejecuta como parte de este import.
- Convenciones en `.claude/CONVENTIONS.md` describen patrones ya existentes
  en el código, pa que futuras contribuciones sean consistentes con lo que
  ya hay.
- El código fuente no fue tocado en este proceso de import.
