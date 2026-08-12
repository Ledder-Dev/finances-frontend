import { createContext, useContext, useState } from 'react';

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
  });

  const setCurrentMonth = (month) => {
    localStorage.setItem('currentMonth', month);
    setCurrentMonthRaw(month);
  };

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
