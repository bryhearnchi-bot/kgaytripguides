/**
 * Port Management Component Tests
 * TDD tests for the new Port Management interface
 * These will fail initially as components don't exist yet
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// These components don't exist yet - will be created during implementation
import { PortManagement } from '../admin/PortManagement';
import { PortCard } from '../admin/PortCard';
import { PortForm } from '../admin/PortForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PortManagement Component', () => {
  const mockPorts = [
    {
      id: 1,
      name: 'Athens',
      country: 'Greece',
      region: 'Mediterranean',
      port_type: 'port' as const,
      coordinates: { lat: 37.9838, lng: 23.7275 },
      description: 'Capital of Greece',
      image_url: 'https://example.com/athens.jpg'
    },
    {
      id: 2,
      name: 'Santorini',
      country: 'Greece',
      region: 'Mediterranean',
      port_type: 'port' as const,
      coordinates: { lat: 36.3932, lng: 25.4615 },
      description: 'Beautiful island',
      image_url: 'https://example.com/santorini.jpg'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Port List Display', () => {
    it('should render port management interface', () => {
      render(<PortManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Port Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search ports/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new port/i })).toBeInTheDocument();
    });

    it('should display ports in a grid layout', async () => {
      // Mock API response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ports: mockPorts })
      } as Response);

      render(<PortManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Athens')).toBeInTheDocument();
        expect(screen.getByText('Santorini')).toBeInTheDocument();
      });

      // Check grid layout
      const grid = screen.getByTestId('ports-grid');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should display port details on each card', async () => {
      render(<PortCard port={mockPorts[0]} />, { wrapper: createWrapper() });

      expect(screen.getByText('Athens')).toBeInTheDocument();
      expect(screen.getByText('Greece')).toBeInTheDocument();
      expect(screen.getByText('Mediterranean')).toBeInTheDocument();
      expect(screen.getByText('37.9838, 23.7275')).toBeInTheDocument();
    });

    it('should show loading state while fetching', () => {
      render(<PortManagement />, { wrapper: createWrapper() });

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should show empty state when no ports', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ports: [] })
      } as Response);

      render(<PortManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/no ports found/i)).toBeInTheDocument();
        expect(screen.getByText(/add your first port/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter ports by search term', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search ports/i);
      await userEvent.type(searchInput, 'Athens');

      await waitFor(() => {
        expect(screen.getByText('Athens')).toBeInTheDocument();
        expect(screen.queryByText('Santorini')).not.toBeInTheDocument();
      });
    });

    it('should filter ports by region', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const regionFilter = screen.getByRole('combobox', { name: /filter by region/i });
      await userEvent.selectOptions(regionFilter, 'Mediterranean');

      expect(screen.getByText('Athens')).toBeInTheDocument();
      expect(screen.getByText('Santorini')).toBeInTheDocument();
    });

    it('should filter ports by type', async () => {
      const portsWithTypes = [
        ...mockPorts,
        { ...mockPorts[0], id: 3, name: 'At Sea', port_type: 'sea_day' as const }
      ];

      render(<PortManagement initialPorts={portsWithTypes} />, { wrapper: createWrapper() });

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i });
      await userEvent.selectOptions(typeFilter, 'sea_day');

      await waitFor(() => {
        expect(screen.getByText('At Sea')).toBeInTheDocument();
        expect(screen.queryByText('Athens')).not.toBeInTheDocument();
      });
    });

    it('should clear all filters', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search ports/i);
      await userEvent.type(searchInput, 'Athens');

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Athens')).toBeInTheDocument();
        expect(screen.getByText('Santorini')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should open create port modal', async () => {
      render(<PortManagement />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add new port/i });
      await userEvent.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Port')).toBeInTheDocument();
    });

    it('should create a new port', async () => {
      const onSubmit = vi.fn();
      render(<PortForm onSubmit={onSubmit} />, { wrapper: createWrapper() });

      await userEvent.type(screen.getByLabelText(/port name/i), 'Istanbul');
      await userEvent.type(screen.getByLabelText(/country/i), 'Turkey');
      await userEvent.selectOptions(screen.getByLabelText(/region/i), 'Mediterranean');
      await userEvent.selectOptions(screen.getByLabelText(/port type/i), 'port');
      await userEvent.type(screen.getByLabelText(/latitude/i), '41.0082');
      await userEvent.type(screen.getByLabelText(/longitude/i), '28.9784');

      const submitButton = screen.getByRole('button', { name: /save port/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Istanbul',
          country: 'Turkey',
          region: 'Mediterranean',
          port_type: 'port',
          coordinates: { lat: 41.0082, lng: 28.9784 }
        });
      });
    });

    it('should edit an existing port', async () => {
      render(<PortCard port={mockPorts[0]} />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await userEvent.click(editButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Athens')).toBeInTheDocument();
    });

    it('should delete a port with confirmation', async () => {
      const onDelete = vi.fn();
      render(<PortCard port={mockPorts[0]} onDelete={onDelete} />, { wrapper: createWrapper() });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);

      // Confirmation dialog
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      expect(onDelete).toHaveBeenCalledWith(mockPorts[0].id);
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple ports', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[1]);

      expect(screen.getByText('2 ports selected')).toBeInTheDocument();
    });

    it('should bulk delete selected ports', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      // Select ports
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[1]);

      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      await userEvent.click(bulkDeleteButton);

      expect(screen.getByText(/delete 2 ports/i)).toBeInTheDocument();
    });

    it('should select all ports', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await userEvent.click(selectAllCheckbox);

      expect(screen.getByText(`${mockPorts.length} ports selected`)).toBeInTheDocument();
    });
  });

  describe('Image Management', () => {
    it('should upload port image', async () => {
      render(<PortForm />, { wrapper: createWrapper() });

      const file = new File(['image'], 'port.jpg', { type: 'image/jpeg' });
      const input = screen.getByLabelText(/upload image/i);

      await userEvent.upload(input, file);

      expect(screen.getByText('port.jpg')).toBeInTheDocument();
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    it('should validate image format', async () => {
      render(<PortForm />, { wrapper: createWrapper() });

      const file = new File(['doc'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload image/i);

      await userEvent.upload(input, file);

      expect(screen.getByText(/only image files/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      render(<PortForm />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /save port/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/port name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/country is required/i)).toBeInTheDocument();
    });

    it('should validate coordinate format', async () => {
      render(<PortForm />, { wrapper: createWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), 'invalid');
      await userEvent.type(screen.getByLabelText(/longitude/i), '999');

      const submitButton = screen.getByRole('button', { name: /save port/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/invalid latitude/i)).toBeInTheDocument();
      expect(screen.getByText(/longitude must be between/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PortManagement />, { wrapper: createWrapper() });

      expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search ports');
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Ports grid');
    });

    it('should support keyboard navigation', async () => {
      render(<PortManagement initialPorts={mockPorts} />, { wrapper: createWrapper() });

      const firstCard = screen.getByTestId('port-card-0');
      firstCard.focus();

      fireEvent.keyDown(firstCard, { key: 'Enter' });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should announce changes to screen readers', async () => {
      render(<PortManagement />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search ports/i);
      await userEvent.type(searchInput, 'Athens');

      expect(screen.getByRole('status')).toHaveTextContent('Showing 1 port');
    });
  });
});