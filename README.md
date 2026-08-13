# Finance Tracker — Frontend

SPA React 19 + Vite 6 para tracker de finanzas personales/familiares. Consume
la API de [`finances-api`](https://github.com/Ledder-Dev/finances-api): login/signup
(sesión por cookie, Better-Auth), compras/recibos con OCR, ingresos/gastos,
gastos e ingresos fijos/recurrentes, ahorros, deudas, remesas familiares y
sync bancario vía Plaid.

Migración completa desde una versión vanilla JS anterior (task 034, cutover) —
todo `src/` es React por dominio, sin código vanilla remanente. Historia
completa de la migración en `TASKS.md` (tareas #018-034) y `docs/adr/`.

## Stack

- **React 19** + **Vite 6** — dev server, HMR, build
- **Vitest 4** + **@testing-library/react** + **@testing-library/jest-dom** — tests
- **Chart.js** (CDN, script en `index.html`) — gráficas de tendencia mensual
- **Plaid Link** (CDN, script en `index.html`) — conexión bancaria
- Sin router (`react-router` no se usa — una sola pantalla, tabs por state
  interno, ver [Arquitectura](#arquitectura))
- Sin librería de estado externa (Redux/Zustand) — Context API + hooks
- Auth por cookie de sesión httpOnly (Better-Auth del lado de `finances-api`),
  `credentials: 'include'` en cada fetch

## Arquitectura

```
main.jsx
  └─ AuthContext (login/signup, sesión)
       └─ App.jsx
            ├─ AuthGate.jsx        (status === 'anon')
            └─ Layout.jsx          (status === 'authenticated')
                 ├─ AppStateProvider (mes actual, productos, categorías, hero stats)
                 ├─ HeroBanner / SummaryGrid
                 ├─ TabNav
                 └─ tabs por dominio: PurchasesTab, ProductList, TransactionsTab,
                    SavingsTab+DebtsTab, FamilyTab, AnalysisTab, BankTab
                 └─ SettingsModal (montado siempre, controlado por state en Layout)
```

**Capas y responsabilidades:**

- **`src/api.js`** — único punto de fetch. Reescribe `window.fetch` global:
  intercepta 401 (`onUnauthorized`), antepone `API_BASE` a rutas `/api/*`,
  fuerza `credentials: 'include'`. Ningún componente hace `fetch` directo —
  siempre vía `apiFetch`.
- **`src/AuthContext.jsx`** — sesión: `status` (`loading` | `anon` | `authenticated`),
  `user`, `login`/`signup`/`logout`.
- **`src/state/AppStateContext.jsx`** — estado global compartido entre tabs
  (mes actual, productos, miembros de familia, categorías de transacciones,
  datos de sync Plaid, hero stats). Un hook `use*` por slice
  (`useCurrentMonth`, `useProducts`, etc.) — nunca se consume el context
  crudo fuera de este archivo.
- **`src/Layout.jsx`** — shell de la app autenticada: header, selector de mes,
  `TabNav`, monta todos los tabs (ocultos con CSS, nunca desmontados) y el
  `SettingsModal`.
- **`src/<dominio>/`** (`products/`, `transactions/`, `receipts/`, `savings/`,
  `debts/`, `family-bank/`, `analysis/`, `dashboard/`) — un tab o feature
  por carpeta: `<Dominio>Tab.jsx` como entrada, `*Row.jsx`/`*Form.jsx`/`*List.jsx`
  como piezas internas.
- **`src/components/`** — piezas reusables cross-dominio (`TabNav`, selects,
  `AuthGate`, `SettingsModal`).
- **`src/lib/`** — helpers puros sin estado (`findProduct.js`).
- **`src/analysis.js`** / **`src/state.js`** — funciones puras y constantes
  compartidas entre varios dominios (`trimmedMean`, categorías/unidades por
  defecto).

**Integraciones externas:**

- **`finances-api`** — contrato compartido en
  `_shared/contracts/finances/api-contract.yaml` (symlink, backend es la
  fuente de verdad). Auth por cookie de sesión, no JWT en `localStorage`.
- **Plaid Link** (CDN) — sync bancario, `family-bank/BankTab.jsx`.
- **Chart.js** (CDN) — gráficas de tendencia, `analysis/AnalysisTab.jsx`.

**Decisiones de arquitectura relevantes:**

- Sin router: todo vive en un solo `Layout`, tabs controlados por state local
  (`activeTab`), no por URL.
- Migración incremental dominio por dominio (#018-034), no big-bang rewrite —
  vanilla y React convivieron en `src/` durante la transición, hasta el
  cutover final (#034).

Ver `.claude/ARCHITECTURE.md` para el detalle completo (misma fuente que esta
sección) y `docs/adr/` para el historial de decisiones.

## Convenciones de código

Resumen — ver `.claude/CONVENTIONS.md` para el detalle completo:

1. **Fetch** — nunca `fetch` directo en un componente, siempre `apiFetch` de `src/api.js`.
2. **Estado global vs local** — estado compartido entre tabs vive en
   `AppStateContext.jsx` (un hook por slice); estado propio de un
   tab/form se queda local.
3. **Estructura por dominio** — carpeta `src/<dominio>/` con `<Dominio>Tab.jsx`
   como entry point; componentes cross-dominio en `components/`, helpers
   puros en `lib/`.
4. **Fetch on activate, no on mount** — los tabs disparan su fetch inicial
   cuando la prop `active` pasa a `true`, no en cada montaje (todos los tabs
   se montan juntos en `Layout` y se ocultan con CSS).
5. **Modales controlados desde el padre** — visibilidad por prop
   `open` + callback `onClose`, el padre dueño del state.
6. **Confirmación en acciones destructivas** — `window.confirm()` antes del
   fetch, sin modal custom.
7. **Tests** — Vitest + Testing Library, `*.test.js`/`*.test.jsx` junto al
   archivo que testea, no en carpeta `__tests__/` separada.

## Requisitos

- Node.js 18+
- `finances-api` corriendo (por defecto se asume en `localhost:3001`)

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar si hace falta:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — URL base del backend (opcional). Si no se define, en
  `localhost` usa `http://localhost:3001`, y en cualquier otro host usa
  `http://<mismo-host>:3001` (heurística de fallback pensada para desarrollo).
  Para producción con el backend en un dominio propio, definir esta variable
  explícitamente (ej. `https://api.midominio.com`).

## Desarrollo
```bash
npm install
npm run dev
```
Levanta el dev server de Vite (por defecto en `http://localhost:5173`).

## Build / preview
```bash
npm run build
npm run preview
```

## Testing
```bash
npm test
```
Corre la suite con Vitest + jsdom + React Testing Library. Cubre funciones
puras (`trimmedMean`, resolución de `API_BASE`, `apiFetch`), componentes
compartidos (`CategorySelect`/`UnitSelect`/`ProductTypeSelect`, `findProduct`)
y componentes de dominio con lógica de negocio propia (ej. `DebtsTab`: carga,
validación, settle, delete con confirm). No persigue cobertura exhaustiva de
render de cada tab — cada task en `TASKS.md` documenta qué se verificó al
portar ese dominio.

## Estructura del proyecto
- `index.html` — entry point único, monta `<div id="root">` vía `src/main.jsx`
- `public/styles.css` — estilos, servido como estático
- `src/main.jsx` — entry: `<App/>` envuelto en `StrictMode > AuthProvider > AppStateProvider`
- `src/App.jsx` — switch según `useAuth().status` (`loading`/`anon`/autenticado)
- `src/AuthContext.jsx` — sesión (login/signup/logout, cookie httpOnly)
- `src/state/AppStateContext.jsx` — estado global compartido entre tabs (mes
  actual, productos, categorías, hero stats), un hook `use*` por slice
- `src/Layout.jsx` — shell autenticado: header, selector de mes, `TabNav`,
  monta todos los tabs (ocultos con CSS) y `SettingsModal`
- `src/api.js` — `API_BASE`, `apiFetch` (inyecta `credentials: 'include'`, maneja 401)
- `src/analysis.js` / `src/state.js` — funciones puras y constantes compartidas
  entre varios dominios (`trimmedMean`, categorías/unidades por defecto)
- `src/products/`, `src/transactions/`, `src/receipts/`, `src/savings/`,
  `src/debts/`, `src/family-bank/`, `src/analysis/`, `src/dashboard/` —
  un dominio por carpeta, `<Dominio>Tab.jsx` como entrada
- `src/components/` — piezas reusables cross-dominio (`TabNav`, selects,
  `AuthGate`, `SettingsModal`)
- `src/lib/` — helpers puros sin estado
- `vite.config.js` — config de dev server, build y tests (Vitest)

Ver `.claude/ARCHITECTURE.md` para más detalle de arquitectura,
`.claude/CONVENTIONS.md` para el detalle completo de convenciones, y
`docs/adr/001-import-baseline.md` / `docs/adr/005-*` (migración React) para
el historial de decisiones.

## Deploy — Cloudflare Pages

Sitio estático (`npm run build` genera `dist/`), sin SPA-router client-side
(tabs por state en memoria, no por URL) — no hace falta `_redirects` ni config
de fallback.

Setup vía dashboard de Cloudflare Pages, conectado al repo
`Ledder-Dev/finances-frontend`:

1. **Build command:** `npm run build`
2. **Build output directory:** `dist`
3. **Variables de entorno** (Settings → Environment variables, en Production
   y/o Preview según haga falta): `VITE_API_BASE_URL` apuntando al dominio de
   `finances-api` en producción (ej. `https://api.midominio.com`).
4. Cada push a la branch conectada dispara un build/deploy automático.

El backend (`finances-api`) se despliega por separado (ver su propio README).
