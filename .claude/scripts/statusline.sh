#!/usr/bin/env bash
# .claude/scripts/statusline.sh
#
# Barra de estado para Claude Code. Recibe JSON de la sesión por stdin y escribe
# una línea por stdout. Muestra: modelo, rama git y directorio actual.
#
# Instalación: /new-world copia esta carpeta a worlds/<mundo>/.claude/scripts/.
# Referenciado en .claude/settings.local.json de cada mundo vía
# $CLAUDE_PROJECT_DIR/.claude/scripts/statusline.sh (statusLine.command).
#
# Requiere `jq` para parsear el JSON de entrada (opcional: si no está, degrada).

input="$(cat)"

# Modelo (si jq está disponible)
if command -v jq >/dev/null 2>&1; then
  model="$(printf '%s' "$input" | jq -r '.model.display_name // .model.id // "claude"' 2>/dev/null || echo claude)"
else
  model="claude"
fi

# Rama git actual
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"

# Directorio actual (basename)
dir="$(basename "$(pwd)")"

# Estado del working tree (limpio/sucio)
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    dirty="±"
  else
    dirty="✓"
  fi
else
  dirty=""
fi

printf '⚡ %s  |  %s %s  |  %s' "$model" "$branch" "$dirty" "$dir"
