import { state } from './state.js';

export function updateHeroNetSavings() {
  const el = document.getElementById('heroSavings');
  if (!el) return;
  const net = state.heroSavingsTotal - state.heroPayableTotal + state.heroReceivableTotal;
  el.textContent = `$${net.toFixed(2)}`;
}

export function updateHeroInvestment() {
  const el = document.getElementById('heroInvestment');
  if (!el) return;
  const netSavings = state.heroSavingsTotal - state.heroPayableTotal + state.heroReceivableTotal;
  const investment = netSavings - 12 * state.heroAvgExpenses12;
  el.textContent = `$${investment.toFixed(2)}`;
}
