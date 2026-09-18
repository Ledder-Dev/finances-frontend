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

## doing

## review

- [ ] [S] [ops][019] **PR #3 pendiente review compañero** — restaura entrada task #018 (pm2 local) perdida en conflicto stash vs main. https://github.com/Ledder-Dev/finances-frontend/pull/3 (2026-08-18)

## done

- [x] [P] [react][037] **Tab Compare: comparar productos por precio** — llenaba el gap documentado en #031 ("Tab Compare sigue sin contenido"). `src/products/CompareTab.jsx` nuevo, mismo patrón fetch-on-activate que `ProductList.jsx` (`GET /api/product-history`, sin endpoint nuevo). Agrupa purchases por `product_id` → mejor precio por producto → agrupa por `product_type`, ordena ascendente, marca el más barato (🏆). Buscador de texto por tipo (`<input>`+`<datalist>`, mismo patrón que categorías de `TransactionForm.jsx`). Unidades del sistema son fijas (`U`/`Oz`/`Lt`/`Lb`, `src/state.js:20`) — como hay productos cargados en Oz y otros en Lb, el precio se normaliza a libra (1 Lb = 16 Oz) antes de comparar y ordenar (`UNIT_TO_BASE` en `CompareTab.jsx`); `Lt`/`U` no tienen contraparte convertible, quedan tal cual. `Layout.jsx`: agregado import + rama `{id === 'compare' && <CompareTab active={...} />}`, `TabNav.jsx` ya traía la tab desde #022. Verificado: `npm run build` limpio. No se pudo probar render interactivo en browser (sin herramienta de browser en este entorno) — solo build + lógica revisada. Salteado a propósito: filtro por nombre de producto (solo por tipo), soporte de más unidades (gramos/ml) — agregar si se cargan productos en esas unidades. (2026-09-06)
- [x] [S] [react][036] **Fix categoría "coding" pre-seleccionada en Bank Sync review** — `TellerReviewCard.jsx` (transacciones pendientes de revisar en Bank Sync) inicializaba `category` con `categoriesFor(dbTxCategories, type)[0]` — primer elemento del array combinado DB+default, orden arbitrario del backend, no "más usada"; para expenses eso siempre resolvía a "coding", forzando borrarlo cada vez. Corregido a mismo patrón que `TransactionForm.jsx`: arranca vacío (`useState('')`), se resetea a vacío en cambio de tipo, input con `placeholder="Category"`. `categoriesFor()`/el `<datalist>` no cambiaron, solo dejaron de usarse como default. Verificado: `npm run build` limpio. (2026-09-06)






