# ADR 003 — Migración de repo a `Ledder-Dev` + deploy en GitHub Pages

## Estado
Aceptado

## Fecha
2026-08-04

## Contexto
Repo vivía en `camachoeng/finances-frontend` (privado). Usuario quiso (1)
mover el trabajo en curso a la org `github.com/Ledder-Dev` y (2) desplegar
el frontend vía GitHub Pages, gratis. Pages gratis solo funciona con repos
públicos en orgs de plan free — bloqueó la decisión hasta confirmar
visibilidad.

## Decisión
- Repo nuevo `Ledder-Dev/finances-frontend`, **público**, historia completa
  (no transfer de ownership — push de `master` y `development`).
- Repo viejo `camachoeng/finances-frontend` queda intacto, remote local
  renombrado `camachoeng` (secundario, sin push futuro planeado).
- `vite.config.js`: `base: '/finances-frontend/'` (Pages tipo proyecto, no
  org page — URL final `https://ledder-dev.github.io/finances-frontend/`).
- `.github/workflows/deploy-pages.yml`: build en push a `master` vía
  `actions/upload-pages-artifact` + `actions/deploy-pages`
  (`permissions: pages: write, id-token: write`).
- Pages del repo configurado con `build_type: workflow` (Actions como
  fuente, no branch estático).

## Alternativas consideradas
- **Repo privado + Pages de pago (Pro/Team)**: descartado — costo no
  justificado pa proyecto personal/familiar.
- **Transfer de ownership del repo viejo**: descartado — usuario quiere
  repo viejo intacto como respaldo, no reemplazado.

## Consecuencias
- `finances-backend` todavía no tiene URL pública HTTPS — el deploy en
  Pages queda arriba pero la app no funciona en runtime hasta que el
  backend también esté público (`API_BASE` resuelve a `http://<hostname>:3001`
  sin `VITE_API_BASE_URL`, rompe por mixed content HTTPS→HTTP). Backend
  público queda como tarea separada, fuera de este mundo.
- Repo y código ahora públicos — cualquier secreto nuevo que se filtre
  queda expuesto de inmediato (ver incidente cerrado en `TASKS.md` #005,
  causa distinta pero mismo tipo de riesgo). `.gitignore` ya cubre
  `.mcp.json`, `opencode.json`, `graphify-out/`.
- CI corre en cada push a `master` — build falla ahí si `npm run build`
  rompe, señal temprana antes de llegar a producción.
