import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebtsTab } from './DebtsTab.jsx';
import { AppStateProvider } from '../state/AppStateContext.jsx';
import { apiFetch } from '../api.js';

vi.mock('../api.js', () => ({ apiFetch: vi.fn() }));

const jsonRes = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve({ data }) });

const openDebt = { id: 1, type: 'payable', person: 'John', description: '', amount: '50', month: '2026-08', settled: false };

function renderTab(debts = [openDebt]) {
  apiFetch.mockImplementation((url, options = {}) => {
    if (url === '/api/debts' && !options.method) return jsonRes(debts);
    if (url === '/api/analysis') return jsonRes({ months: [], categories: [] });
    if (url.startsWith('/api/savings')) return jsonRes([]);
    return jsonRes(debts);
  });
  return render(<AppStateProvider><DebtsTab active /></AppStateProvider>);
}

describe('DebtsTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads and lists open debts with the running total', async () => {
    renderTab();
    expect(await screen.findByText('John')).toBeInTheDocument();
    expect(screen.getAllByText('$50.00')).toHaveLength(2); // row amount + total open
    expect(screen.getByText('Total open')).toBeInTheDocument();
  });

  it('requires person and amount before adding', async () => {
    window.alert = vi.fn();
    renderTab([]);
    await screen.findByText('Add debt');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(window.alert).toHaveBeenCalledWith('Person and amount are required.');
    expect(apiFetch).not.toHaveBeenCalledWith('/api/debts', expect.objectContaining({ method: 'POST' }));
  });

  it('deletes only after confirm', async () => {
    window.confirm = vi.fn(() => false);
    renderTab();
    await screen.findByText('John');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalledWith('Delete this entry?');
    expect(apiFetch).not.toHaveBeenCalledWith(expect.stringContaining('/1'), expect.objectContaining({ method: 'DELETE' }));
  });

  it('settles a debt', async () => {
    renderTab();
    await screen.findByText('John');
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/api/debts/1/settle', { method: 'PUT' }));
  });
});
