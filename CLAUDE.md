# Mundo: finances-frontend

@$AI_OS_ROOT/CLAUDE.md
@$AI_OS_ROOT/_shared/contracts/finances/api-contract.yaml

## Contexto específico
Frontend single-page (React 19 + Vite), tracker finanzas personales/familiares. Consume `finances-api` (puerto 3001): login/signup, compras/recibos OCR, ingresos/gastos, ahorros, deudas, remesas familiares, sync bancario vía Plaid. Repo: https://github.com/Ledder-Dev/finances-frontend (repo viejo `camachoeng/finances-frontend` queda como remote secundario `camachoeng`, sin actividad)

## Stack
- React 19 + Vite 6 (dev server + build)
- Vitest + Testing Library — tests unitarios/componentes
- Chart.js (CDN): gráficas tendencia mensual
- Plaid Link (CDN): conexión bancaria
- Auth: cookie de sesión (`credentials: 'include'`), `apiFetch` centralizado en `src/api.js`, maneja 401

## Estado actual
Migración vanilla JS → React 19 completada (cutover, task 034). Todo `src/`
es React por dominio (`src/<dominio>/*.jsx`), sin código vanilla remanente.
Deploy vía Cloudflare Pages, ver `README.md`. Ver `.claude/ARCHITECTURE.md`
y `TASKS.md` pa detalle por dominio.

## graphify

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Proyecto tiene knowledge graph en graphify-out/: god nodes, community structure, cross-file relationships.

Rules:
- Preguntas de codebase: run `graphify query "<question>"` primero cuando graphify-out/graph.json exista. Use `graphify path "<A>" "<B>"` para relaciones y `graphify explain "<concept>"` para conceptos focused. Retornan scoped subgraph, usualmente mucho menor que GRAPH_REPORT.md o raw grep output.
- Si graphify-out/wiki/index.md existe, use pa broad navigation en vez de raw source browsing.
- Read graphify-out/GRAPH_REPORT.md solo pa broad architecture review o cuando query/path/explain no surface suficiente contexto.
- Después de modificar código, run `graphify update .` pa keep graph current (AST-only, no API cost).