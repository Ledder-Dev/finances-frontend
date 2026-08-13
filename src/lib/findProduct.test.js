import { describe, it, expect } from 'vitest';
import { findProduct } from './findProduct.js';

describe('findProduct', () => {
  const products = [{ name: 'Milk' }, { name: 'Bread' }];

  it('finds a product case-insensitively', () => {
    expect(findProduct(products, 'milk')).toEqual({ name: 'Milk' });
  });

  it('returns undefined when not found', () => {
    expect(findProduct(products, 'Eggs')).toBeUndefined();
  });
});
