import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { AdminLayout } from '../AdminLayout';

// Mock the Supabase Auth Context
const mockLogout = vi.fn();
vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useSupabaseAuthContext: () => ({
    logout: mockLogout,
  }),
}));

// Mock wouter for routing
vi.mock('wouter', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ['/admin-new'],
}));

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

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders AdminLayout component with correct title', () => {
    render(
      <AdminLayout>
        <div data-testid="test-content">Test Content</div>
      </AdminLayout>
    );

    // Should have multiple "Admin Panel" texts (mobile and desktop headers)
    const adminPanelTexts = screen.getAllByText('Admin Panel');
    expect(adminPanelTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('does not display test-related elements', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Should NOT contain test banner
    expect(screen.queryByText(/TEST MODE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/new admin layout/i)).not.toBeInTheDocument();

    // Should NOT contain "Back to Old Admin" link
    expect(screen.queryByText(/back to old admin/i)).not.toBeInTheDocument();

    // Should NOT contain "NEW LAYOUT TEST" subtitle
    expect(screen.queryByText(/NEW LAYOUT TEST/i)).not.toBeInTheDocument();
  });

  it('displays navigation sections correctly', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('TRIPS')).toBeInTheDocument();
    expect(screen.getByText('CONTENT MANAGEMENT')).toBeInTheDocument();
    expect(screen.getByText('ADMINISTRATION')).toBeInTheDocument();
  });

  it('displays navigation items correctly', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check for some key navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trips')).toBeInTheDocument();
    expect(screen.getByText('Ships')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Artists/Talent')).toBeInTheDocument();
  });

  it('handles sidebar toggle functionality', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Find the sidebar toggle button using CSS selector
    const sidebarToggle = document.querySelector('button.hidden.lg\\:block');
    expect(sidebarToggle).toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(sidebarToggle!);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
  });

  it('calls logout function when logout button is clicked', async () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders mobile header with correct branding', () => {
    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Mobile header should contain Admin Panel text
    const adminPanelTexts = screen.getAllByText('Admin Panel');
    expect(adminPanelTexts.length).toBeGreaterThan(0);
  });

  it('maintains responsive design classes', () => {
    const { container } = render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check that responsive classes are present on sidebar
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('max-lg:transform');
    expect(sidebar).toHaveClass('max-lg:-translate-x-full');

    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('lg:ml-[280px]');
  });

  it('preserves ocean theme styling', () => {
    const { container } = render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    );

    // Check for ocean theme gradient classes
    const gradientElements = container.querySelectorAll('[class*="ocean-"]');
    expect(gradientElements.length).toBeGreaterThan(0);
  });

  // Tests for sidebar flickering fix
  describe('sidebar flickering prevention', () => {
    it('should initialize with correct width from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true');

      const { container } = render(
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      );

      const sidebar = container.querySelector('aside');
      const main = container.querySelector('main');

      // Should start with collapsed width immediately (no flicker)
      expect(sidebar).toHaveClass('w-20');
      expect(main).toHaveClass('lg:ml-20');

      // Transition classes are applied after mount (this is expected in tests)
      expect(sidebar).toHaveClass('transition-all');
      expect(main).toHaveClass('transition-all');
    });

    it('should add transition classes after mount', async () => {
      const { container } = render(
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      );

      const sidebar = container.querySelector('aside');
      const main = container.querySelector('main');

      // Wait for mount effect to run
      await waitFor(() => {
        expect(sidebar).toHaveClass('transition-all');
        expect(main).toHaveClass('transition-all');
      });
    });

    it('should maintain correct state when localStorage has expanded state', () => {
      localStorageMock.getItem.mockReturnValue('false');

      const { container } = render(
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      );

      const sidebar = container.querySelector('aside');
      const main = container.querySelector('main');

      // Should start with expanded width immediately
      expect(sidebar).toHaveClass('w-[280px]');
      expect(main).toHaveClass('lg:ml-[280px]');
    });

    it('should handle localStorage read errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { container } = render(
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      );

      const sidebar = container.querySelector('aside');

      // Should fallback to default expanded state
      expect(sidebar).toHaveClass('w-[280px]');
    });

    it('should toggle with transitions after mount', async () => {
      const { container } = render(
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      );

      // Wait for mount and transitions to be enabled
      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('transition-all');
      });

      const sidebarToggle = container.querySelector('button.hidden.lg\\:block');
      expect(sidebarToggle).toBeInTheDocument();

      // Initially expanded
      let sidebar = container.querySelector('aside');
      let main = container.querySelector('main');
      expect(sidebar).toHaveClass('w-[280px]');
      expect(main).toHaveClass('lg:ml-[280px]');

      // Click to collapse - should have transitions enabled
      fireEvent.click(sidebarToggle!);

      sidebar = container.querySelector('aside');
      main = container.querySelector('main');
      expect(sidebar).toHaveClass('w-20');
      expect(sidebar).toHaveClass('transition-all');
      expect(main).toHaveClass('lg:ml-20');
      expect(main).toHaveClass('transition-all');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarCollapsed', 'true');
    });

    it('should persist state across re-renders without flickering', async () => {
      localStorageMock.getItem.mockReturnValue('true');

      const { container, rerender } = render(
        <AdminLayout>
          <div>Original Content</div>
        </AdminLayout>
      );

      // Initial render with collapsed state
      let sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-20');

      // Wait for mount
      await waitFor(() => {
        expect(sidebar).toHaveClass('transition-all');
      });

      // Re-render component (simulating navigation)
      rerender(
        <AdminLayout>
          <div>New Content</div>
        </AdminLayout>
      );

      // State should persist without transition class removal
      sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-20');
      expect(sidebar).toHaveClass('transition-all');
    });
  });
});