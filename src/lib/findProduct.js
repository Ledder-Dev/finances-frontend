export function findProduct(products, name) {
  return products.find((p) => p.name.toLowerCase() === name.toLowerCase());
}
