import { describe, it, expect, beforeEach } from 'vitest';
import { state } from './state.js';
import { categoryInput, typeInputHtml, unitOptions, findProduct } from './ui-helpers.js';

describe('unitOptions', () => {
  it('renders one <option> per unit', () => {
    const html = unitOptions();
    expect(html).toContain('<option value="U">U — unit</option>');
    expect(html).toContain('<option value="Lb">Lb — pound</option>');
  });

  it('marks the selected unit', () => {
    const html = unitOptions('Oz');
    expect(html).toContain('<option value="Oz" selected>Oz — ounce</option>');
  });
});

describe('categoryInput', () => {
  it('builds a select with the given element id', () => {
    const html = categoryInput('cat-1');
    expect(html).toContain('id="cat-1"');
    expect(html).toContain('Miscellaneous');
  });

  it('marks the given value as selected', () => {
    const html = categoryInput('cat-1', null, 'Foods');
    expect(html).toContain('value="Foods" selected');
  });

  it('wires onRLCategoryChange only when a lineId is given', () => {
    expect(categoryInput('cat-1')).not.toContain('onchange');
    expect(categoryInput('cat-1', 5)).toContain('onRLCategoryChange(5)');
  });
});

describe('typeInputHtml', () => {
  beforeEach(() => {
    state.allProducts = [{ product_type: 'Snacks' }, { product_type: 'Snacks' }, { product_type: 'Drinks' }];
  });

  it('deduplicates and sorts product types from state', () => {
    const html = typeInputHtml(3);
    expect(html).toContain('rl-type-3');
    expect(html.indexOf('Drinks')).toBeLessThan(html.indexOf('Snacks'));
    expect(html.match(/<option value="Snacks">/g)).toHaveLength(1);
  });
});

describe('findProduct', () => {
  beforeEach(() => {
    state.allProducts = [{ name: 'Milk' }, { name: 'Bread' }];
  });

  it('finds a product case-insensitively', () => {
    expect(findProduct('milk')).toEqual({ name: 'Milk' });
  });

  it('returns undefined when not found', () => {
    expect(findProduct('Eggs')).toBeUndefined();
  });
});
