# ADR 005 — Migración de vanilla JS a React

## Estado
Aceptado

## Fecha
2026-08-12

## Contexto
`finances-frontend` es hoy vanilla JS (ES6 modules) + Vite, manipulación
directa del DOM, handlers `onclick`/`oninput` inline en HTML, estado global
mutable (`src/state.js`). Funciona, pero el usuario planea a futuro convertir
la app en PWA instalable (offline-first, service worker, sync en background).
Vanilla JS sin capa de componentes hace ese salto costoso: no hay
reconciliación de UI declarativa, el estado global mutable no compone bien
con estrategias de cache/sync offline, y cada feature nueva (11 dominios:
auth/products/purchases/transactions/receipts/family-bank/debts/settings/
recurring/savings/analysis) ya pesa 2365 líneas repartidas en 14 módulos con
handlers acoplados al DOM real.

Se evaluó también Astro (usado en otros mundos del universo, ver
`_shared/commands/new-world-astro.md`) — descartado: Astro es content-first
(islands puntuales, output estático por defecto), pensado pa landings/blogs/
docs, no pa apps con estado cliente pesado y mucha interactividad. Migrar a
Astro y luego a React pa la PWA sería doble migración.

## Decisión
Migrar `finances-frontend` de vanilla JS a **React 19 + Vite**, en rama
`feature/react-migration`, sin tocar `master`/`development` hasta cutover
final. Desglose completo de tareas en `TASKS.md` (ids 018+).

Principios de la migración:
- **Sin reescritura de diseño** — mismo `styles.css`/paleta, solo cambia la
  capa de renderizado (DOM imperativo → componentes declarativos).
- **Sin Redux ni state library externa** — Context API + hooks alcanza pa
  el tamaño de esta app (YAGNI, evitar dependencia nueva sin necesidad real).
- **Sin router** — la app es tabs dentro de una sola pantalla, no rutas
  reales; mantener navegación por estado local, no `react-router-dom`, salvo
  que un dominio nuevo lo justifique después.
- **`src/api.js` (fetch wrapper + `credentials:'include'`) se reusa casi tal
  cual** — no es código acoplado al DOM, no necesita reescritura.
- Migración dominio por dominio (paralelizable entre sí una vez lista la
  base: auth/state/layout), cutover único al final — nunca los dos stacks
  sirviendo tráfico real en simultáneo en producción.

## Consecuencias
- Habilita camino a PWA futura (`vite-plugin-pwa`, service worker,
  manifest.json) sin segunda migración de framework — fuera de alcance de
  esta migración, se evalúa cuando el usuario lo pida explícitamente.
- Retrofit CFD (`.claude/` con `skills_stack`) pausado — se hace una sola
  vez al cierre (task de cutover), con `skills_stack: "react"`, no dos veces
  (una pa vanilla y otra pa react).
- Suite de tests actual (`analysis.test.js`/`api.test.js`/`ui-helpers.test.js`,
  17 tests) se porta a equivalentes en componentes — no se descarta cobertura.
- `registry.json` (`_shared/memory/registry.json`) se actualiza en el
  cutover final, no antes (mientras dura la migración el stack real sigue
  siendo vanilla en `master`/`development`).

## Alternativas consideradas
- **Astro** — descartado, ver Contexto (content-first, no apto pa apps con
  estado cliente pesado ni como paso intermedio hacia PWA).
- **Mantener vanilla JS** — descartado, el propio usuario pidió migrar
  pensando en la PWA futura.
- **Next.js** — descartado por ahora: esta app no necesita SSR/SSG (todo el
  contenido es privado, detrás de auth), el overhead de un framework full-stack
  no se justifica sobre React+Vite pa una SPA que ya consume una API propia
  (`finances-api`). Reconsiderar solo si aparece necesidad real de SSR.
