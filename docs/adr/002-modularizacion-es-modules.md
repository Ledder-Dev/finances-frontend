# ADR 002 — Modularización de `app.js` a ES modules

## Estado
Aceptado

## Fecha
2026-07-29

## Contexto
`public/app.js` era un solo archivo (~2080 líneas) con toda la lógica cliente:
auth, fetch de las 8 pestañas (Purchases, Transactions, Products, Compare,
Savings, Analysis, Family, Bank Sync), sin separación en módulos (ver ADR 001,
baseline de import). Backlog CFD (`TASKS.md` #001) marcaba modularización
como deuda técnica explícita, sin bundler de componentes ni framework UI.

## Decisión
Dividir `app.js` en módulos ES nativos bajo `src/`, bundleados por Vite (ya
presente solo pa dev server/build, sin agregar herramienta nueva):
`state`, `api`, `auth`, `core`, `receipts`, `savings`, `debts`, `analysis`,
`family-bank`, `settings`, `ui-helpers`, `hero`, `main`. `index.html` pasa a
cargar `<script type="module" src="/src/main.js">`.

Se mantiene el patrón de handlers inline (`onclick`/`onchange`/`oninput` en
HTML generado, muchos vía `innerHTML` dinámico) exponiendo todas las
funciones de dominio en `window` desde `main.js` — no se migró a
event listeners ni a un framework, pa no mezclar dos refactors distintos en
un mismo cambio.

## Alternativas consideradas
- **Framework UI (React/Vue) + bundler de componentes**: descartado —
  fuera de proporción pa el alcance actual (SPA personal/familiar, sin
  necesidad de reactividad compleja), y contradice convención de mundo
  "vanilla JS, sin framework UI".
- **Mover handlers inline a `addEventListener`**: descartado por ahora —
  requeriría re-cablear los 65 handlers y sus contrapartes generadas
  dinámicamente vía `innerHTML`; se deja como refactor futuro separado si
  se justifica.

## Consecuencias
- Build limpio con `npm run build`: 15 módulos, sin warnings.
- Auditoría estática cruzando los 65 nombres de función usados en
  `onclick`/`oninput`/`onchange`/`onblur`/`onfocus` contra las funciones
  exportadas confirmó cero huecos — ningún handler quedó sin su función.
- Smoke test visual en navegador real confirmado por el usuario (auth gate
  carga sin errores de consola con `finances-backend` levantado).
- Convención de mundo (`.claude/CONVENTIONS.md` / `CLAUDE.md`) actualizada
  pa reflejar `src/*.js` como ubicación de la lógica, ya no `public/app.js`.
- Exponer funciones en `window` es deuda intencional, no accidental —
  documentado acá pa que no se confunda con descuido en futuras revisiones.
