import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { trimmedMean } from '../analysis.js';

const AppStateContext = createContext(null);

function defaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function AppStateProvider({ children }) {
  const [currentMonth, setCurrentMonthRaw] = useState(() => localStorage.getItem('currentMonth') || defaultMonth());
  const [allProducts, setAllProducts] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dbTxCategories, setDbTxCategories] = useState({ expense: [], income: [] });
  const [plaidSyncData, setPlaidSyncData] = useState([]);
  const [heroStats, setHeroStats] = useState({
    savingsTotal: 0,
    avgExpenses12: 0,
    payableTotal: 0,
    receivableTotal: 0,
    historicNet: 0,
    historicMonths: 0,
    expensePct: 0,
  });

  const setCurrentMonth = (month) => {
    localStorage.setItem('currentMonth', month);
    setCurrentMonthRaw(month);
  };

  useEffect(() => {
    const loadHeroStats = async () => {
      const [analysisRes, savingsRes, debtsRes] = await Promise.all([
        apiFetch('/api/analysis').then((r) => r.json()),
        apiFetch(`/api/savings?month=${currentMonth}`).then((r) => r.json()),
        apiFetch('/api/debts').then((r) => r.json()),
      ]);

      const upToSelected = analysisRes.data.months.filter((m) => m.month <= currentMonth && m.month !== currentMonth);
      const last12 = upToSelected.slice(0, 12);
      const allPast = upToSelected;

      const historicNet = allPast.reduce((s, m) => s + (m.income - m.expenses), 0);
      const totalIncome = last12.reduce((s, m) => s + m.income, 0);
      const totalExp = last12.reduce((s, m) => s + m.expenses, 0);
      const expensePct = totalIncome > 0 ? (totalExp / totalIncome) * 100 : 0;
      const avgExpenses12 = last12.length >= 2 ? trimmedMean(last12.map((m) => m.expenses)) : 0;

      const hasBalance = savingsRes.data.some((a) => a.balance !== null);
      const savingsTotal = hasBalance ? savingsRes.data.reduce((sum, a) => sum + (a.balance || 0), 0) : 0;

      const openTotal = (t) => debtsRes.data.filter((d) => d.type === t && !d.settled).reduce((s, d) => s + parseFloat(d.amount), 0);

      setHeroStats({
        savingsTotal,
        avgExpenses12,
        payableTotal: openTotal('payable'),
        receivableTotal: openTotal('receivable'),
        historicNet,
        historicMonths: allPast.length,
        expensePct,
      });
    };
    loadHeroStats();
  }, [currentMonth]);

  const value = {
    currentMonth, setCurrentMonth,
    allProducts, setAllProducts,
    familyMembers, setFamilyMembers,
    dbTxCategories, setDbTxCategories,
    plaidSyncData, setPlaidSyncData,
    heroStats, setHeroStats,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export const useCurrentMonth = () => {
  const { currentMonth, setCurrentMonth } = useAppState();
  return [currentMonth, setCurrentMonth];
};

export const useProducts = () => {
  const { allProducts, setAllProducts } = useAppState();
  return [allProducts, setAllProducts];
};

export const useFamilyMembers = () => {
  const { familyMembers, setFamilyMembers } = useAppState();
  return [familyMembers, setFamilyMembers];
};

export const useTxCategories = () => {
  const { dbTxCategories, setDbTxCategories } = useAppState();
  return [dbTxCategories, setDbTxCategories];
};

export const usePlaidSyncData = () => {
  const { plaidSyncData, setPlaidSyncData } = useAppState();
  return [plaidSyncData, setPlaidSyncData];
};

export const useHeroStats = () => {
  const { heroStats, setHeroStats } = useAppState();
  return [heroStats, setHeroStats];
};
