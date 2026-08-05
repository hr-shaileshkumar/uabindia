import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('renders with default variant', () => {
    render(<Input placeholder='Enter text' />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-[var(--erp-border)]');
  });
});
