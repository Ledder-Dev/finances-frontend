import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySelect } from './CategorySelect.jsx';
import { DEFAULT_PRODUCT_CATEGORIES } from '../state.js';

describe('CategorySelect', () => {
  it('renders one option per default category', () => {
    render(<CategorySelect id="cat-1" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: DEFAULT_PRODUCT_CATEGORIES[0] })).toBeInTheDocument();
  });

  it('marks the given value as selected', () => {
    render(<CategorySelect id="cat-1" value={DEFAULT_PRODUCT_CATEGORIES[0]} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue(DEFAULT_PRODUCT_CATEGORIES[0]);
  });

  it('calls onChange with the picked value', () => {
    const onChange = vi.fn();
    render(<CategorySelect id="cat-1" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: DEFAULT_PRODUCT_CATEGORIES[1] } });
    expect(onChange).toHaveBeenCalledWith(DEFAULT_PRODUCT_CATEGORIES[1]);
  });
});
