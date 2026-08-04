# Mundo: finances-frontend

@../../CLAUDE.md
@$AI_OS_ROOT/_shared/contracts/finances/api-contract.yaml

## Contexto específico
Frontend single-page (vanilla JS + Vite), tracker finanzas personales/familiares. Consume `finances-backend` (puerto 3001): login/signup JWT, compras/recibos OCR, ingresos/gastos, ahorros, deudas, remesas familiares, sync bancario vía Plaid. Repo: https://github.com/Ledder-Dev/finances-frontend (repo viejo `camachoeng/finances-frontend` queda como remote secundario `camachoeng`, sin actividad)

## Stack
- Vanilla JS (ES6+) + HTML + CSS, sin framework UI
- Vite 6 — solo dev server + build, sin bundler componentes
- Chart.js (CDN): gráficas tendencia mensual
- Plaid Link (CDN): conexión bancaria
- Auth: token JWT en `localStorage`, `fetch` global interceptado, inyecta `Authorization: Bearer`, maneja 401

## Estado actual
Importado universo, retrofit CFD. Código funcional (single file
`public/app.js`, ~2080 líneas, sin módulos). Ver `docs/adr/001-import-baseline.md`
y `.claude/CURRENT_STATUS.md` pa detalle.

## graphify

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Proyecto tiene knowledge graph en graphify-out/: god nodes, community structure, cross-file relationships.

Rules:
- Preguntas de codebase: run `graphify query "<question>"` primero cuando graphify-out/graph.json exista. Use `graphify path "<A>" "<B>"` para relaciones y `graphify explain "<concept>"` para conceptos focused. Retornan scoped subgraph, usualmente mucho menor que GRAPH_REPORT.md o raw grep output.
- Si graphify-out/wiki/index.md existe, use pa broad navigation en vez de raw source browsing.
- Read graphify-out/GRAPH_REPORT.md solo pa broad architecture review o cuando query/path/explain no surface suficiente contexto.
- Después de modificar código, run `graphify update .` pa keep graph current (AST-only, no API cost).