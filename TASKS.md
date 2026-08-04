# Tareas — finances-frontend

> Kanban del mundo. Editar desde el dashboard (`_shared/token-stack/dashboard.html`)
> o con `/tasks` en Claude Code — misma fuente, este archivo es la verdad.
>
> Toda tarea nueva lleva marca `[P]`/`[S]` junto al tag de módulo (ver
> `$AI_OS_ROOT/_shared/CONVENTIONS.md`):
> - `[P]` paralelizable — no toca los mismos archivos ni depende de otra tarea activa.
> - `[S]` secuencial — depende de otra tarea o toca archivos compartidos con ella.
>
> Formato: `- [ ] [P] [modulo][id] **Título** — descripción. (fecha)`

## backlog

- [ ] [S] [ops][011] **Definir mecanismo de deploy pa finances-frontend** — GitHub Pages descartado: usuario recibió notificación de GitHub sobre configuración de la org `Ledder-Dev` que lo bloquea (detalle exacto no confirmado en este mundo). Revertido: sitio Pages deshabilitado, workflow `.github/workflows/deploy-pages.yml` eliminado, `base` removido de `vite.config.js`. Repo en `Ledder-Dev/finances-frontend` sigue siendo el activo — solo falta decidir CÓMO desplegar. Ver `docs/adr/003-migracion-ledder-dev-github-pages.md` (actualización al final). (2026-08-04)

## doing

## review

## done

- [x] [S] [ops][010] **Migrar repo a github.com/Ledder-Dev** — usuario confirmó repo público. Repo nuevo `Ledder-Dev/finances-frontend` creado con historia completa (`master`+`development` pusheados), repo viejo `camachoeng/finances-frontend` intacto como remote secundario `camachoeng`, default branch puesto a `master`. Deploy vía GitHub Pages intentado y revertido después (ver #011) — la migración del repo en sí queda cerrada y en uso. (2026-08-04)
- [x] [S] [ops][005] **Reescribir historia git — descartada** — GitGuardian detectó `UMAMI_PASSWORD` y `PAGESPEED_API_KEY` expuestos en texto plano en `opencode.json`, commit `70ab062`. Rotación de ambas credenciales: hecha por compañero (2026-07-30). Reescritura de historia (`git filter-repo` + force-push a `origin/master` y `origin/development`, ambas ramas comparten el commit) descartada por decisión del usuario — secretos ya rotados, riesgo/beneficio de reescribir no lo justifica. `opencode.json` y `.mcp.json` ya en `.gitignore` para evitar recurrencia. Cerrado como decisión final, no pendiente. (2026-08-01)
- [x] [S] [app][009] **Fix pantalla negra en LAN móvil** — `auth.init()` en `src/auth.js` no tenía try/catch: si `apiFetch('/api/auth/me')` fallaba (backend inalcanzable desde móvil por LAN), la promesa rechazaba sin manejo, ni `showAuthGate()` ni `hideAuthGate()` corrían, y quedaba visible el fondo oscuro (`--bg-page`) sin gate ni container — pantalla negra. Agregado try/catch: en error de red se loguea y se muestra el auth gate. Causa raíz de por qué el backend es inalcanzable desde móvil (host bind, firewall, CORS) queda por confirmar del lado de `finances-backend` — fuera de este mundo. (2026-07-31)
- [x] [S] [app][008] **ADR 002 modularización ES modules** — `docs/adr/002-modularizacion-es-modules.md` documenta decisión ya ejecutada (#001), alternativas descartadas y consecuencias. Cuenta huérfana Teller confirmada limpia por el usuario. (2026-07-31)
- [x] [S] [app][007] **Merge `.claude/CLAUDE.md` en `CLAUDE.md`** — trigger `/graphify` movido a sección `## graphify` de `CLAUDE.md` raíz del mundo; `.claude/CLAUDE.md` eliminado (redundante). (2026-07-30)
- [x] [S] [app][006] **Fix link cuenta bancaria en Savings tab** — `src/savings.js` comparaba `a.teller_account_id` (campo viejo, ya no existe en response de `/api/savings`) contra `t.account_id` de `/api/teller/balances`; backend renombró el campo a `plaid_account_id` al migrar de Teller a Plaid. Balance sí sincronizaba pero UI nunca mostraba "Auto — banco" tras enlazar. Corregido: comparación ahora usa `a.plaid_account_id`. Verificado en navegador real por el usuario — las 3 cuentas enlazadas (Ive's Checking, Ive's Savings, My Savings) muestran estado "Auto" tras el fix. También verificado en sesión: conexión Plaid real funciona end-to-end (create-link-token → Link modal → exchange-token → balances/enrollments cargan tras "Check now"). Cuenta vieja huérfana de config Teller anterior ("Customized Cash Rewards Visa Signature") sigue apareciendo — pendiente que el usuario pruebe botón Disconnect; si no limpia, es dato huérfano en DB de `finances-backend`, fuera de alcance de este mundo. (2026-07-30)
- [x] [P] [app][003] **README.md** — expandido: requisitos, variables de entorno (`VITE_API_BASE_URL`), desarrollo, build/preview, testing, estructura completa de `src/*.js` y nota de deploy. (2026-07-29)
- [x] [P] [app][002] **Agregar tests** — Vitest + jsdom instalados, `npm test` corre `vitest run`. Alcance: funciones puras/aisladas extraídas en #001 — `trimmedMean` (analysis), `unitOptions`/`categoryInput`/`typeInputHtml`/`findProduct` (ui-helpers), resolución de `API_BASE` con/sin `VITE_API_BASE_URL` y `apiFetch` (inyección de header Authorization), 17 tests. NO se persigue cobertura de flujos de render/DOM completos (fuera de proporción para SPA sin capa de dominio separada). (2026-07-29)
- [x] [S] [app][004] **Config API_BASE por env var** — `import.meta.env.VITE_API_BASE_URL` con fallback a heurística de hostname; `.env.example` agregado. (2026-07-29)
- [x] [S] [app][001] **Modularizar app.js** — dividido en `src/*.js` (ES modules bundleados por Vite): `state`, `api`, `auth`, `core`, `receipts`, `savings`, `debts`, `analysis`, `family-bank`, `settings`, `ui-helpers`, `hero`, `main`. Verificado con `npm run build` limpio (15 módulos, sin warnings) + auditoría estática cruzando los 65 nombres de función usados en `onclick`/`oninput`/`onchange`/`onblur`/`onfocus` (incluyendo los generados dinámicamente vía `innerHTML`) contra las funciones exportadas — cero huecos. Smoke test visual confirmado por el usuario en navegador real, con `finances-backend` levantado (auth gate carga sin errores de consola). (2026-07-29)
