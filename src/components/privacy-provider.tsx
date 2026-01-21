'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface PrivacyContextType {
  isBlurred: boolean;
  toggleBlur: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(false);

  // Load blur preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('privacy-blur-names');
    if (savedPreference === 'true') {
      setIsBlurred(true);
    }
  }, []);

  // Memoize toggleBlur to prevent unnecessary re-renders
  const toggleBlur = useCallback(() => {
    setIsBlurred((prev) => {
      const newValue = !prev;
      localStorage.setItem('privacy-blur-names', String(newValue));
      return newValue;
    });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ isBlurred, toggleBlur }),
    [isBlurred, toggleBlur]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
