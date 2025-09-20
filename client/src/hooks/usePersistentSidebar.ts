import { useState, useEffect } from 'react';

/**
 * Custom hook for managing sidebar collapsed state with localStorage persistence
 * Prevents flickering by initializing state synchronously from localStorage
 */
export function usePersistentSidebar(defaultValue: boolean = false) {
  // Initialize state synchronously from localStorage to prevent flicker
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn('Failed to read sidebar state from localStorage:', error);
      return defaultValue;
    }
  });

  // Track if component has mounted to control transitions
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after first render to enable transitions
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [collapsed]);

  const toggle = () => {
    setCollapsed(prev => !prev);
  };

  return {
    collapsed,
    setCollapsed,
    toggle,
    isMounted
  };
}