import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnitSelect } from './UnitSelect.jsx';

describe('UnitSelect', () => {
  it('renders one option per unit', () => {
    render(<UnitSelect id="u-1" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'U — unit' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lb — pound' })).toBeInTheDocument();
  });

  it('marks the selected unit', () => {
    render(<UnitSelect id="u-1" value="Oz" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('Oz');
  });
});
