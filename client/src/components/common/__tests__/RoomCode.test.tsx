import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomCode } from '../RoomCode';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, size }: { value: string; size: number }) => (
    <div data-testid="qr" data-value={value} data-size={size} />
  ),
}));

describe('RoomCode', () => {
  it('renders the room code text', () => {
    render(<RoomCode code="ABCD" />);
    expect(screen.getByText('ABCD')).toBeInTheDocument();
  });

  it('renders QR code when enabled', () => {
    render(<RoomCode code="WING" showQR size="sm" />);
    const qr = screen.getByTestId('qr');
    expect(qr).toBeInTheDocument();
    expect(qr.getAttribute('data-value')).toContain('/play/WING');
    expect(qr.getAttribute('data-size')).toBe('80');
  });
});
