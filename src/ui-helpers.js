import { state, DEFAULT_PRODUCT_CATEGORIES, UNITS } from './state.js';

export function categoryInput(elementId, lineId = null, value = '') {
  const opts = DEFAULT_PRODUCT_CATEGORIES.map(c =>
    `<option value="${c}"${c === value ? ' selected' : ''}>${c}</option>`
  ).join('');
  const onChange = lineId !== null ? `onchange="onRLCategoryChange(${lineId})"` : '';
  return `<select id="${elementId}" ${onChange}><option value="">Select category</option>${opts}</select>`;
}

export function populateTypeSelect(selectEl, category) {
  const types = [...new Set(
    state.allProducts
      .filter(p => !category || p.category === category)
      .map(p => p.product_type)
  )].filter(Boolean).sort();
  selectEl.innerHTML =
    `<option value="">Select type</option>` +
    types.map(t => `<option value="${t}">${t}</option>`).join('') +
    `<option value="__new__">— New type —</option>`;
}

export function typeInputHtml(id) {
  const types = [...new Set(state.allProducts.map(p => p.product_type))].filter(Boolean).sort();
  return `
    <select id="rl-type-${id}" onchange="onRLTypeChange(${id})">
      <option value="">Select type</option>
      ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
      <option value="__new__">— New type —</option>
    </select>
    <input type="text" id="rl-type-new-${id}" placeholder="New product type" style="display:none;margin-top:6px;width:100%;padding:8px 10px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;">
  `;
}

export function unitOptions(selected = '') {
  return UNITS.map(([v, l]) => `<option value="${v}"${v === selected ? ' selected' : ''}>${v} — ${l}</option>`).join('');
}

export function findProduct(name) {
  return state.allProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
}
