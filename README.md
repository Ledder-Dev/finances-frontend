# Finance Tracker — Frontend

SPA vanilla JS (ES modules) + Vite para tracker de finanzas personales/familiares.
Consume la API de [`finances-backend`](https://github.com/camachoeng/finances-backend):
login/signup JWT, compras/recibos con OCR, ingresos/gastos, ahorros, deudas,
remesas familiares y sync bancario vía Plaid.

## Requisitos
- Node.js 18+
- `finances-backend` corriendo (por defecto se asume en `localhost:3001`)

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
Corre la suite con Vitest + jsdom. Alcance actual: funciones puras/aisladas
(`trimmedMean`, helpers de HTML en `ui-helpers.js`, resolución de `API_BASE` e
inyección de header `Authorization` en `apiFetch`). No cubre flujos de
render/DOM completos — es una SPA sin capa de dominio separada, y esa
cobertura no está en proporción con el alcance del proyecto hoy.

## Estructura del proyecto
- `index.html` — markup de las 8 pestañas de la app (Purchases, Income &
  Expenses, Products, Compare, Savings, Analysis, Family, Bank Sync)
- `public/styles.css` — estilos, servido como estático
- `src/main.js` — entry point: importa todos los módulos de dominio y expone
  sus funciones en `window` (la UI depende de atributos `onclick`/`onchange`
  inline, incluidos varios generados dinámicamente vía `innerHTML`)
- `src/state.js` — estado mutable compartido entre módulos y constantes
- `src/api.js` — `API_BASE`, override de `fetch` con inyección de JWT y manejo de 401
- `src/auth.js` — login/signup, auth gate
- `src/core.js` — carga general de la app, purchases, products, transactions, compare
- `src/receipts.js` — recibos y sus líneas (incluye scan/OCR)
- `src/savings.js` — cuentas de ahorro
- `src/debts.js` — deudas
- `src/analysis.js` — análisis mensual y gráficas (Chart.js)
- `src/family-bank.js` — remesas familiares y sync bancario (Plaid)
- `src/settings.js` — personalización (fondo, dim)
- `src/ui-helpers.js` / `src/hero.js` — helpers compartidos de UI y métricas hero
- `vite.config.js` — config de dev server, build y tests (Vitest)

Ver `docs/adr/001-import-baseline.md` y `.claude/ARCHITECTURE.md` para más
detalle de arquitectura.

## Deploy
El frontend se sirve como sitio estático (`npm run build` genera `dist/`).
El backend (`finances-backend`) se despliega por separado; apuntar
`VITE_API_BASE_URL` a su dominio en el entorno de build de producción.
