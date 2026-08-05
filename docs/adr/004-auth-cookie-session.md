# ADR 004 — Auth: de JWT bearer en localStorage a sesión por cookie

## Estado
Aceptado

## Fecha
2026-08-05

## Contexto
`finances-api` migró su capa de auth a Better-Auth, que maneja sesión vía
cookie (`credentials: true` en CORS) en vez de emitir un JWT que el cliente
guardaba en `localStorage` y reenviaba como header `Authorization: Bearer`.
El cambio lo decidió y ejecutó el mundo backend — este ADR documenta el
lado frontend, que debía adaptarse pa seguir autenticando.

## Decisión
`src/api.js`:
- `apiFetch` ya no lee `authToken()` de `localStorage` ni inyecta header
  `Authorization`. Ahora manda `credentials: 'include'` en cada request a
  `/api/*`, dejando que el navegador maneje la cookie de sesión.
- `authToken()` queda sin uso real (función viva mientras no se confirme
  que ningún otro flujo la necesita — candidato a limpieza en refactor
  futuro).

## Consecuencias
- Requiere que `finances-api` tenga CORS con `credentials: true` y origin
  explícito (no `*`) pa que el navegador acepte la cookie cross-origin en
  dev (`localhost:5173` → `localhost:3002`).
- Login/logout ya no dependen de guardar/borrar token en `localStorage` —
  cualquier código nuevo de auth debe asumir sesión por cookie, no bearer.
- Probado en local contra `finances-api` (puerto 3002) vía `.env.local`
  (`VITE_API_PORT=3002`, gitignored).

## Alternativas consideradas
Mantener JWT bearer en paralelo — descartado: backend ya no lo soporta,
duplicar mecanismos de auth no aporta nada.
