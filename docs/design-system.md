# Design System — finances-frontend
> Claude Design lee este archivo al apuntar la carpeta del mundo.
> Mantenerlo actualizado garantiza coherencia visual entre sesiones.

## Identidad
- Proyecto: Finance Tracker
- Audiencia: uso personal/familiar (un owner + familia)
- Tono visual: minimalista, funcional, cards blancas sobre fondo claro

## Paleta de colores
| Token         | Valor   | Uso                    |
|---------------|---------|------------------------|
| --color-primary   | #0c447c | CTAs, énfasis, links unit price |
| --color-bg        | #ffffff | Fondo                  |
| --color-text      | #222222 | Texto principal        |
| --color-muted     | #666666 / #999999 | Texto secundario, placeholders |
| --color-danger    | #ef4444 | Badges de alerta (bank sync) |

## Tipografía
- Sistema (sin webfont declarada explícita en `styles.css`)
- Tamaño base inputs/labels: 13-14px

## Espaciado
- Cards con `border-radius: 8-12px`
- Gaps de formulario típicos: 6-12px

## Componentes clave
- `.card` — contenedor blanco con sombra sutil, base de casi toda la UI
- `.btn` / `.btn-primary` / `.btn-sm` / `.btn-danger` — botones
- `.tabs` / `.tab` / `.tab-section` — navegación por pestañas (Purchases,
  Income & Expenses, Products, Compare, Savings, Analysis, Family, Bank Sync)
- `.modal-overlay` / `.modal-box` — modal de settings (foto de fondo)
- `.hero-banner` — resumen de net/savings/investment arriba del dashboard

## Exports y handoffs
Ver docs/design/ para los bundles recibidos desde Claude Design (aún no
generados — proyecto recién importado).
