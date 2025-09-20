import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { usePersistentSidebar } from '../usePersistentSidebar';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console.warn to prevent test noise
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('usePersistentSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('initialization', () => {
    it('should initialize with default value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePersistentSidebar(false));

      expect(result.current.collapsed).toBe(false);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebarCollapsed');
    });

    it('should initialize with localStorage value when present', () => {
      localStorageMock.getItem.mockReturnValue('true');

      const { result } = renderHook(() => usePersistentSidebar(false));

      expect(result.current.collapsed).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebarCollapsed');
    });

    it('should use default value when localStorage contains invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => usePersistentSidebar(false));

      expect(result.current.collapsed).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to read sidebar state from localStorage:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage access errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => usePersistentSidebar(true));

      expect(result.current.collapsed).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to read sidebar state from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('mount state tracking', () => {
    it('should have isMounted as true after mount', () => {
      const { result } = renderHook(() => usePersistentSidebar(false));

      // After render hook completes, isMounted should be true (effects have run)
      expect(result.current.isMounted).toBe(true);
    });
  });

  describe('state persistence', () => {
    it('should persist state changes to localStorage', () => {
      const { result } = renderHook(() => usePersistentSidebar(false));

      act(() => {
        result.current.toggle();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
      expect(result.current.collapsed).toBe(true);
    });

    it('should handle localStorage write errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage write failed');
      });

      const { result } = renderHook(() => usePersistentSidebar(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.collapsed).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to save sidebar state to localStorage:',
        expect.any(Error)
      );
    });

    it('should allow direct state setting via setCollapsed', () => {
      const { result } = renderHook(() => usePersistentSidebar(false));

      act(() => {
        result.current.setCollapsed(true);
      });

      expect(result.current.collapsed).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
    });
  });

  describe('toggle functionality', () => {
    it('should toggle state from false to true', () => {
      const { result } = renderHook(() => usePersistentSidebar(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.collapsed).toBe(true);
    });

    it('should toggle state from true to false', () => {
      localStorageMock.getItem.mockReturnValue('true');
      const { result } = renderHook(() => usePersistentSidebar(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.collapsed).toBe(false);
    });

    it('should persist each toggle to localStorage', () => {
      const { result } = renderHook(() => usePersistentSidebar(false));

      // First toggle
      act(() => {
        result.current.toggle();
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');

      // Second toggle
      act(() => {
        result.current.toggle();
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'false');
    });
  });
});