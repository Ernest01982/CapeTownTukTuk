import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthContextType } from '../hooks/useAuth';
import { useCart, CartContextType } from '../hooks/useCart';

// 1. Define the shape of the context data
interface AppContextProps {
  auth: AuthContextType;
  cart: CartContextType;
}

// 2. Create the context
const AppContext = createContext<AppContextProps | undefined>(undefined);

// 3. Create the provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const cart = useCart();

  const value = { auth, cart };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 4. Create a custom hook for easy access to the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};