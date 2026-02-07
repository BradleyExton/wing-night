import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader } from '../Card';

describe('Card', () => {
  it('renders children and className', () => {
    render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    const card = screen.getByText('Content').parentElement;
    expect(card?.className).toContain('custom-class');
  });

  it('adds selected styles when selected', () => {
    const { container } = render(<Card selected>Selected</Card>);
    const card = container.firstElementChild as HTMLElement | null;
    expect(card?.className).toContain('ring-2');
  });

  it('calls onClick when interactive', async () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Click me</Card>);
    await userEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('CardHeader', () => {
  it('renders header text', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});
