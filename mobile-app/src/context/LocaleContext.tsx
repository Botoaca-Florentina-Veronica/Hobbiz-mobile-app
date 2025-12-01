import React, { createContext, useContext, ReactNode } from 'react';
 
type LocaleContextType = {
  locale: 'ro' | 'en' | string;
};
 
const defaultValue: LocaleContextType = { locale: 'ro' };
 
const LocaleContext = createContext<LocaleContextType>(defaultValue);
 
export const LocaleProvider = ({ children, locale = 'ro' }: { children: ReactNode; locale?: string }) => {
  return <LocaleContext.Provider value={{ locale }}>{children}</LocaleContext.Provider>;
};
 
export const useLocale = () => {
  return useContext(LocaleContext);
};
 
export default LocaleContext;