import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

const SupabaseAuthContext = createContext<ReturnType<typeof useSupabaseAuth> | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return (
    <SupabaseAuthContext.Provider value={auth}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuthContext() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
}