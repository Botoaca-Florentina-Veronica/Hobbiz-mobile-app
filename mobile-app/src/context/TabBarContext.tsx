import React, { createContext, useContext, useState, useCallback } from 'react';

type TabBarContextValue = {
  hidden: boolean; // true when one or more callers requested hide
  hideTabBar: () => void;
  showTabBar: () => void;
  reset: () => void;
};

const TabBarContext = createContext<TabBarContextValue | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: React.ReactNode }) => {
  // use a counter to allow multiple callers to request hiding without stomping on each other
  const [hideCount, setHideCount] = useState(0);

  const hideTabBar = useCallback(() => setHideCount((c) => c + 1), []);
  const showTabBar = useCallback(() => setHideCount((c) => Math.max(0, c - 1)), []);
  const reset = useCallback(() => setHideCount(0), []);

  const value: TabBarContextValue = {
    hidden: hideCount > 0,
    hideTabBar,
    showTabBar,
    reset,
  };

  return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
};

export const useTabBar = () => {
  const ctx = useContext(TabBarContext);
  if (!ctx) throw new Error('useTabBar must be used within TabBarProvider');
  return ctx;
};

export default TabBarContext;
