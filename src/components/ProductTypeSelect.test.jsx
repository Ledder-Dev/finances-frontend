import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductTypeSelect } from './ProductTypeSelect.jsx';

const products = [
  { name: 'a', category: 'Foods', product_type: 'Snacks' },
  { name: 'b', category: 'Foods', product_type: 'Snacks' },
  { name: 'c', category: 'Foods', product_type: 'Drinks' },
];

describe('ProductTypeSelect', () => {
  it('deduplicates and sorts product types', () => {
    render(<ProductTypeSelect id="pt-1" products={products} category="Foods" onChange={() => {}} />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options.filter((t) => t === 'Snacks')).toHaveLength(1);
    expect(options.indexOf('Drinks')).toBeLessThan(options.indexOf('Snacks'));
  });

  it('filters types by category', () => {
    render(<ProductTypeSelect id="pt-1" products={products} category="Drinks" onChange={() => {}} />);
    expect(screen.queryByRole('option', { name: 'Snacks' })).not.toBeInTheDocument();
  });

  it('switches to free-text input when "New type" is picked', () => {
    const onChange = vi.fn();
    render(<ProductTypeSelect id="pt-1" products={products} category="Foods" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__new__' } });
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.getByPlaceholderText('New product type')).toBeInTheDocument();
  });
});
