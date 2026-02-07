import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timer } from '../Timer';

const useTimerMock = vi.fn();

vi.mock('../../../hooks/useTimer', () => ({
  useTimer: (...args: unknown[]) => useTimerMock(...args),
}));

describe('Timer', () => {
  it('renders nothing when idle', () => {
    useTimerMock.mockReturnValue({ remaining: 0, status: 'idle', formatted: '0:00' });
    const { container } = render(<Timer timerState={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows paused label and icon when paused with showLabel', () => {
    useTimerMock.mockReturnValue({ remaining: 30, status: 'paused', formatted: '0:30' });
    render(<Timer timerState={null} showLabel />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('⏸️')).toBeInTheDocument();
  });

  it('shows expiration message when expired', () => {
    useTimerMock.mockReturnValue({ remaining: 0, status: 'expired', formatted: '0:00' });
    render(<Timer timerState={null} />);
    expect(screen.getByText("TIME'S UP!")).toBeInTheDocument();
  });
});
