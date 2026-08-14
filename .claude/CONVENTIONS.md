# Convenciones — finances-frontend

@$AI_OS_ROOT/_shared/CONVENTIONS.md

## 1. Fetch
Nunca `fetch` directo a `/api/*` en un componente. Usar `apiFetch` de `src/api.js`
(inyecta `API_BASE`, `credentials: 'include'`, dispara `onUnauthorized` en 401).

## 2. Estado global vs local
Estado compartido entre tabs (mes actual, productos, categorías, hero stats) vive en
`state/AppStateContext.jsx`, expuesto por un hook `use*` por slice — nunca se consume
`useContext(AppStateContext)` fuera de ese archivo. Estado propio de un tab/form
(inputs, toggles) se queda local al componente.

## 3. Estructura por dominio
Cada feature es una carpeta en `src/<dominio>/` con `<Dominio>Tab.jsx` como entry point
y piezas internas `*Row.jsx` / `*Form.jsx` / `*List.jsx`. Componentes cross-dominio van
en `components/`; helpers puros sin JSX ni estado van en `lib/`.

## 4. Fetch on activate, no on mount
Los tabs reciben prop `active` y disparan su fetch inicial cuando `active` pasa a
`true` (patrón `useEffect` con guard `if (!active) return`), no en cada montaje —
todos los tabs se montan juntos en `Layout` y se ocultan con CSS.

## 5. Modales controlados desde el padre
Modales (ej. `SettingsModal`) se montan siempre en `Layout`, visibilidad por prop
`open` + callback `onClose`; el padre dueño del state (`useState`), no el modal.

## 6. Confirmación en acciones destructivas
Delete/undo irreversible pasa por `window.confirm()` antes del fetch — no hay modal
de confirmación custom (YAGNI mientras no haga falta).

## 7. Migración vanilla → React (histórico)
Migración completada en task 034 (cutover) — ya no queda código vanilla en `src/`.
Convención usada durante la transición (#018-033): mientras un dominio no estaba
migrado, su lógica vivía en `src/<dominio>.js` (vanilla); al migrar se creaba
`src/<dominio>/<Dominio>Tab.jsx`, se portaba la lógica y se actualizaba `Layout.jsx`.
Queda documentada acá por si un patrón similar hace falta a futuro.

## 8. Tests
Vitest + Testing Library. Un `*.test.js`/`*.test.jsx` junto al archivo que testea,
no en carpeta `__tests__/` separada.

---
Convenciones inferidas del código actual (2026-08). Si un patrón nuevo no calza acá,
seguir el ejemplo más cercano en `src/` antes de inventar uno nuevo.
