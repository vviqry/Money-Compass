import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Transaction, Settings, Category } from '@/types';
import {
  getAllTransactions,
  addTransaction as dbAdd,
  updateTransaction as dbUpdate,
  deleteTransaction as dbDelete,
  getSettings,
  saveSettings as dbSaveSettings,
  replaceAllData,
} from '@/lib/db';
import {
  DEFAULT_SETTINGS,
  ALL_DEFAULT_CATEGORIES,
} from '@/lib/constants';

// ─── State Shape ─────────────────────────────────────────────────────

interface AppState {
  transactions: Transaction[];
  settings: Settings;
  categories: Category[];
  isLoading: boolean;
  isHydrated: boolean;
}

const initialState: AppState = {
  transactions: [],
  settings: DEFAULT_SETTINGS,
  categories: ALL_DEFAULT_CATEGORIES,
  isLoading: true,
  isHydrated: false,
};

// ─── Actions ─────────────────────────────────────────────────────────

type AppAction =
  | { type: 'HYDRATE'; transactions: Transaction[]; settings: Settings }
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'UPDATE_TRANSACTION'; id: string; changes: Partial<Transaction> }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'REPLACE_ALL'; transactions: Transaction[]; settings: Settings }
  | { type: 'SET_LOADING'; isLoading: boolean };

// ─── Reducer ─────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE': {
      const categories = ALL_DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        isHighRisk: action.settings.highRiskCategories.includes(cat.name),
      }));
      return {
        ...state,
        transactions: action.transactions,
        settings: action.settings,
        categories,
        isLoading: false,
        isHydrated: true,
      };
    }
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.transaction, ...state.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, ...action.changes, updatedAt: new Date().toISOString() } : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.settings, updatedAt: new Date().toISOString() };
      const categories = ALL_DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        isHighRisk: newSettings.highRiskCategories.includes(cat.name),
      }));
      return { ...state, settings: newSettings, categories };
    }
    case 'REPLACE_ALL': {
      const categories = ALL_DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        isHighRisk: action.settings.highRiskCategories.includes(cat.name),
      }));
      return {
        ...state,
        transactions: action.transactions,
        settings: action.settings,
        categories,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────

interface AppContextType extends AppState {
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (id: string, changes: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  replaceAllAppData: (transactions: Transaction[], settings: Settings) => Promise<void>;
  incomeCategories: Category[];
  expenseCategories: Category[];
  getHighRiskCategories: () => Category[];
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const [transactions, savedSettings] = await Promise.all([
          getAllTransactions(),
          getSettings(),
        ]);
        const settings = savedSettings
          ? { ...DEFAULT_SETTINGS, ...savedSettings }
          : DEFAULT_SETTINGS;

        // Save default settings if none exist
        if (!savedSettings) {
          await dbSaveSettings(DEFAULT_SETTINGS);
        }

        dispatch({ type: 'HYDRATE', transactions, settings });
      } catch (error) {
        console.error('Failed to hydrate app state:', error);
        dispatch({ type: 'HYDRATE', transactions: [], settings: DEFAULT_SETTINGS });
      }
    }
    hydrate();
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', state.settings.theme === 'dark');
    }
  }, [state.settings.theme]);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    await dbAdd(transaction);
    dispatch({ type: 'ADD_TRANSACTION', transaction });
  }, []);

  const updateTransactionFn = useCallback(async (id: string, changes: Partial<Transaction>) => {
    await dbUpdate(id, changes);
    dispatch({ type: 'UPDATE_TRANSACTION', id, changes });
  }, []);

  const deleteTransactionFn = useCallback(async (id: string) => {
    await dbDelete(id);
    dispatch({ type: 'DELETE_TRANSACTION', id });
  }, []);

  const updateSettingsFn = useCallback(async (settings: Partial<Settings>) => {
    const newSettings = { ...state.settings, ...settings, updatedAt: new Date().toISOString() };
    await dbSaveSettings(newSettings);
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, [state.settings]);

  const replaceAllAppData = useCallback(async (transactions: Transaction[], settings: Settings) => {
    await replaceAllData(transactions, settings);
    dispatch({ type: 'REPLACE_ALL', transactions, settings });
  }, []);

  const incomeCategories = state.categories.filter((c) => c.type === 'income');
  const expenseCategories = state.categories.filter((c) => c.type === 'expense');
  const getHighRiskCategories = useCallback(
    () => state.categories.filter((c) => c.isHighRisk),
    [state.categories]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        addTransaction,
        updateTransaction: updateTransactionFn,
        deleteTransaction: deleteTransactionFn,
        updateSettings: updateSettingsFn,
        replaceAllAppData,
        incomeCategories,
        expenseCategories,
        getHighRiskCategories,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
