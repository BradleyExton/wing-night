import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children and handles loading state', () => {
    const { container } = render(
      <Button loading>Save</Button>
    );

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="danger" size="lg">Delete</Button>
    );
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-red-600');
    expect(button.className).toContain('px-6');
  });
});
