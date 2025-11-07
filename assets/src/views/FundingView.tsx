import { useEffect, useState } from 'react';
import { fetchJSON, sendJSON } from '../utils/api';

interface FundingRecord {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  note?: string;
  tx_date: string;
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

const emptyFunding: Partial<FundingRecord> = {
  type: 'income',
  tx_date: new Date().toISOString().substring(0, 10)
};

export const FundingView: React.FC<Props> = ({ addToast }) => {
  const [records, setRecords] = useState<FundingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator] = useState(l4pApp.currentUser.roles.includes('l4p_coordinator'));
  const [isEditing, setIsEditing] = useState(false);
  const [record, setRecord] = useState<Partial<FundingRecord>>(emptyFunding);

  const loadFunding = () => {
    fetchJSON<FundingRecord[]>('funding')
      .then((items) => setRecords(items))
      .catch(() => addToast({ type: 'error', message: 'Unable to load funding.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFunding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (item?: FundingRecord) => {
    if (!isCoordinator) {
      addToast({ type: 'error', message: "You don't have permission to modify funding records." });
      return;
    }
    setRecord(item ? { ...item } : emptyFunding);
    setIsEditing(true);
  };

  const close = () => {
    setIsEditing(false);
  };

  const save = async () => {
    try {
      if (record.id) {
        await sendJSON<FundingRecord>(`funding/${record.id}`, 'POST', record as FundingRecord);
      } else {
        await sendJSON<FundingRecord>('funding', 'POST', record as FundingRecord);
      }
      addToast({ type: 'success', message: 'Funding saved.' });
      close();
      loadFunding();
      window.dispatchEvent(new CustomEvent('l4p-refresh-dashboard'));
    } catch (error) {
      addToast({ type: 'error', message: 'Could not save funding.' });
    }
  };

  const remove = async () => {
    if (!record.id) {
      return;
    }

    try {
      await fetchJSON(`funding/${record.id}`, { method: 'DELETE' });
      addToast({ type: 'success', message: 'Funding deleted.' });
      close();
      loadFunding();
      window.dispatchEvent(new CustomEvent('l4p-refresh-dashboard'));
    } catch (error) {
      addToast({ type: 'error', message: 'Could not delete funding.' });
    }
  };

  return (
    <div className="l4p-stack">
      <header className="l4p-toolbar">
        <h1>Funding</h1>
        {isCoordinator && (
          <div className="l4p-toolbar-actions">
            <a className="l4p-button" href={`${l4pApp.root}funding/export`}>
              Export CSV
            </a>
            <button className="l4p-button" onClick={() => open()}>
              Add Transaction
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="l4p-skeleton" aria-busy="true" />
      ) : (
        <table className="l4p-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type</th>
              <th scope="col">Category</th>
              <th scope="col">Amount</th>
              <th scope="col">Note</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.tx_date).toLocaleDateString()}</td>
                <td>{item.type}</td>
                <td>{item.category || '—'}</td>
                <td>{item.amount.toLocaleString(undefined, { style: 'currency', currency: l4pApp.settings.currency || 'USD' })}</td>
                <td>{item.note || '—'}</td>
                <td>
                  <button className="l4p-link" onClick={() => open(item)}>
                    {isCoordinator ? 'Edit' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="l4p-empty">
                  No funding records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isEditing && (
        <div className="l4p-drawer" role="dialog" aria-modal="true">
          <div className="l4p-drawer-content">
            <header>
              <h2>{record.id ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button aria-label="Close" onClick={close}>
                ×
              </button>
            </header>
            {isCoordinator ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  save();
                }}
              >
                <label>
                  Type
                  <select value={record.type} onChange={(event) => setRecord((prev) => ({ ...prev, type: event.target.value as FundingRecord['type'] }))}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    value={record.amount || ''}
                    onChange={(event) => setRecord((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                    required
                  />
                </label>
                <label>
                  Category
                  <input value={record.category || ''} onChange={(event) => setRecord((prev) => ({ ...prev, category: event.target.value }))} />
                </label>
                <label>
                  Note
                  <textarea value={record.note || ''} onChange={(event) => setRecord((prev) => ({ ...prev, note: event.target.value }))} />
                </label>
                <label>
                  Transaction Date
                  <input type="date" value={record.tx_date?.substring(0, 10)} onChange={(event) => setRecord((prev) => ({ ...prev, tx_date: event.target.value }))} />
                </label>
                <footer className="l4p-drawer-actions">
                  {record.id && (
                    <button type="button" className="l4p-button is-secondary" onClick={remove}>
                      Delete
                    </button>
                  )}
                  <button type="submit" className="l4p-button">
                    Save
                  </button>
                </footer>
              </form>
            ) : (
              <div className="l4p-card l4p-readonly">
                <p>This transaction is read-only for volunteers.</p>
                <button className="l4p-button" onClick={close}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
