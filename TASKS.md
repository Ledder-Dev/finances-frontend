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

- [ ] [S] [ops][005] **Rotar secrets filtrados y reescribir historia git** — GitGuardian detectó `UMAMI_PASSWORD` y `PAGESPEED_API_KEY` (Google API Key) expuestos en texto plano en `opencode.json`, commit `70ab062` (ya pusheado a GitHub). Pendiente: (1) compañero rota ambas credenciales — infra compartida, cuenta `amedesarrollo@gmail.com` en `analytics.ladderdev.com` y proyecto Google Cloud; (2) una vez rotadas, `git filter-repo` para sacar `opencode.json` del historial completo + force-push a origin/master. `opencode.json` y `.mcp.json` ya en `.gitignore` para evitar recurrencia. (2026-07-29)

## doing

## review

## done

- [x] [P] [app][003] **README.md** — expandido: requisitos, variables de entorno (`VITE_API_BASE_URL`), desarrollo, build/preview, testing, estructura completa de `src/*.js` y nota de deploy. (2026-07-29)
- [x] [P] [app][002] **Agregar tests** — Vitest + jsdom instalados, `npm test` corre `vitest run`. Alcance: funciones puras/aisladas extraídas en #001 — `trimmedMean` (analysis), `unitOptions`/`categoryInput`/`typeInputHtml`/`findProduct` (ui-helpers), resolución de `API_BASE` con/sin `VITE_API_BASE_URL` y `apiFetch` (inyección de header Authorization), 17 tests. NO se persigue cobertura de flujos de render/DOM completos (fuera de proporción para SPA sin capa de dominio separada). (2026-07-29)
- [x] [S] [app][004] **Config API_BASE por env var** — `import.meta.env.VITE_API_BASE_URL` con fallback a heurística de hostname; `.env.example` agregado. (2026-07-29)
- [x] [S] [app][001] **Modularizar app.js** — dividido en `src/*.js` (ES modules bundleados por Vite): `state`, `api`, `auth`, `core`, `receipts`, `savings`, `debts`, `analysis`, `family-bank`, `settings`, `ui-helpers`, `hero`, `main`. Verificado con `npm run build` limpio (15 módulos, sin warnings) + auditoría estática cruzando los 65 nombres de función usados en `onclick`/`oninput`/`onchange`/`onblur`/`onfocus` (incluyendo los generados dinámicamente vía `innerHTML`) contra las funciones exportadas — cero huecos. Smoke test visual confirmado por el usuario en navegador real, con `finances-backend` levantado (auth gate carga sin errores de consola). (2026-07-29)
