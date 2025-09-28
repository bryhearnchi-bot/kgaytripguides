import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { AdminLayout } from '../AdminLayout';

const mockSignOut = vi.fn();
const mockSetLocation = vi.fn();

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useSupabaseAuthContext: () => ({
    user: { id: '1', email: 'admin@atlantis.com' },
    profile: { name: 'Bryan Hearn', role: 'admin' },
    signOut: mockSignOut,
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/admin', mockSetLocation],
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders child content', () => {
    render(
      <AdminLayout>
        <div data-testid="content">Content</div>
      </AdminLayout>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText(/Management/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trips')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('navigates when nav item is clicked', () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    fireEvent.click(screen.getByText('Trips'));
    expect(mockSetLocation).toHaveBeenCalledWith('/admin/trips');
  });

  it('allows collapsing and expanding the sidebar', () => {
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    const collapseButton = screen.getByRole('button', { name: /Collapse/i });
    fireEvent.click(collapseButton);

    // When collapsed the button should show an expand icon (aria label)
    expect(screen.getByRole('button', { name: /Expand sidebar/i })).toBeInTheDocument();
  });

});
