# Arquitectura — finances-frontend

## Visión general
SPA React 19 + Vite 6, sin router (una sola pantalla con tabs internos). Consume
`finances-api` (`finances-backend`, puerto 3001) vía `fetch` con cookies (`credentials: 'include'`).
Migrada por completo desde vanilla JS, dominio por dominio (task 034, cutover) —
ver `docs/adr/` y `TASKS.md` pa historia de la migración.

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

## Capas y responsabilidades
- **`api.js`** — único punto de fetch. Reescribe `window.fetch` global: intercepta 401
  (`onUnauthorized`), antepone `API_BASE` a rutas `/api/*`, fuerza `credentials: 'include'`.
  Cualquier fetch nuevo en un componente pasa por `apiFetch`, no por `fetch` directo.
- **`AuthContext.jsx`** — sesión: `status` (`loading` | `anon` | `authenticated`), `user`, `logout`.
- **`state/AppStateContext.jsx`** — estado global compartido entre tabs (mes actual, productos,
  miembros familia, categorías tx, datos sync Plaid, hero stats). Un hook `use*` por slice
  (`useCurrentMonth`, `useProducts`, etc.) — no se consume el context crudo fuera de este archivo.
- **`Layout.jsx`** — shell de la app autenticada: header, selector de mes, `TabNav`, monta todos
  los tabs (ocultos con CSS, no desmontados) y el `SettingsModal`.
- **`src/<dominio>/`** (`products/`, `transactions/`, `receipts/`, `savings/`, `debts/`,
  `family-bank/`, `analysis/`, `dashboard/`) — un tab o feature por carpeta: `<Dominio>Tab.jsx`
  como entrada, `*Row.jsx`/`*Form.jsx`/`*List.jsx` como piezas internas.
- **`components/`** — piezas reusables cross-dominio (`TabNav`, selects, `AuthGate`, `SettingsModal`).
- **`lib/`** — helpers puros sin estado (`findProduct.js`).

## Integraciones externas
- **`finances-api`** (backend propio) — contrato en `_shared/contracts/finances/api-contract.yaml`
  (symlink, backend es fuente de verdad). Auth por cookie de sesión, no JWT en `localStorage`
  (ya migrado respecto a versión vanilla vieja).
- **Plaid Link** (CDN, aún vía vanilla) — sync bancario, usado en `family-bank/BankTab.jsx`.
- **Chart.js** (CDN) — gráficas de tendencia, `analysis/AnalysisTab.jsx`.

## Decisiones de arquitectura relevantes
- Sin router: todo vive en un solo `Layout`, tabs controlados por state local
  (`activeTab`), no por URL. Ver ADR correspondiente si se decide agregar rutas.
- Migración incremental dominio por dominio (ver `TASKS.md`, tareas #018-034),
  no big-bang rewrite — vanilla y React convivieron en `src/` durante la transición,
  hasta el cutover final (#034).
