import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth as useSupabaseAuthHook } from '../hooks/useSupabaseAuth';

const SupabaseAuthContext = createContext<ReturnType<typeof useSupabaseAuthHook> | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuthHook();

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

// Alias for backward compatibility
export const useSupabaseAuth = useSupabaseAuthContext;