import { useHeroStats } from '../state/AppStateContext.jsx';

export function HeroBanner() {
  const [heroStats] = useHeroStats();
  const { historicMonths, historicNet, expensePct, savingsTotal, payableTotal, receivableTotal, avgExpenses12 } = heroStats;

  if (!historicMonths) return null;

  const netSavings = savingsTotal - payableTotal + receivableTotal;
  const investment = netSavings - 12 * avgExpenses12;

  return (
    <div className="hero-banner">
      <div className="hero-label">Historic net</div>
      <div className="hero-net">${historicNet.toFixed(2)}</div>
      <div className="hero-formula" style={{ marginBottom: 6 }}>{historicMonths} month{historicMonths !== 1 ? 's' : ''}</div>
      <div className="hero-secondary">
        <div>
          <div className="hero-label">Net savings</div>
          <div className="hero-savings">${netSavings.toFixed(2)}</div>
          <div className="hero-formula">Savings − payable + receivable</div>
        </div>
        <div>
          <div className="hero-label">Investment funds</div>
          <div className="hero-investment">${investment.toFixed(2)}</div>
          <div className="hero-formula">Net savings − (12 × avg expenses)</div>
        </div>
      </div>
      <div className="hero-pct">{expensePct.toFixed(1)}% of income spent on average (last 12 months)</div>
    </div>
  );
}
