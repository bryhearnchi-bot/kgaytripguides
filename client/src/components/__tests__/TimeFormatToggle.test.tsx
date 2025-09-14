import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TimeFormatToggle from '../TimeFormatToggle';
import { TimeFormatProvider } from '../../contexts/TimeFormatContext';

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <TimeFormatProvider>
      {component}
    </TimeFormatProvider>
  );
};

describe('TimeFormatToggle', () => {
  it('renders 12-hour format by default', () => {
    renderWithContext(<TimeFormatToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();

    const label = screen.getByText('12h');
    expect(label).toBeInTheDocument();
  });

  it('toggles to 24-hour format when clicked', async () => {
    const user = userEvent.setup();
    renderWithContext(<TimeFormatToggle />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    renderWithContext(<TimeFormatToggle />);

    const container = screen.getByRole('switch').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'space-x-2');
  });
});