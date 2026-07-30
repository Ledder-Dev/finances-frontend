export const state = {
  currentMonth: '',
  allProducts: [],
  isNewProduct: false,
  rlCounter: 0,
  lastKnownUnitPrice: 0,
  rlLastUnitPrice: {},
  familyMembers: [],
  heroSavingsTotal: 0,
  heroAvgExpenses12: 0,
  heroPayableTotal: 0,
  heroReceivableTotal: 0,
  chartInstances: {},
  dbTxCategories: { expense: [], income: [] },
  authMode: 'login',
  plaidSyncData: [],
};

export const DEFAULT_PRODUCT_CATEGORIES = ['Miscellaneous', 'Foods', 'Cleaning', 'Hygiene', 'Medicine', 'Tools', 'Clothes', 'Gifts'];
export const UNITS = [['U', 'unit'], ['Oz', 'ounce'], ['Lt', 'liter'], ['Lb', 'pound']];

export const txDefaultCategories = {
  expense: ['Rent', 'Electricity', 'Water', 'Internet', 'Cleaning', 'Transport', 'Miscellaneous'],
  income: ['Salary', 'Transfer', 'Other'],
};
