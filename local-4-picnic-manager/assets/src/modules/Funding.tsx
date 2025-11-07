import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Card } from '../components/ui/Card';
import { useRequest } from '../hooks/useRequest';
import { useBoot } from '../hooks/useBoot';
import { useToast } from '../components/ToastContext';

type FundingRecord = {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note?: string;
  tx_date: string;
};

type FundingResponse = { data: FundingRecord[]; summary: { income: number; expense: number; net: number } };

const summarize = (items: FundingRecord[]) => {
  let income = 0;
  let expense = 0;
  items.forEach((item) => {
    if (item.type === 'income') {
      income += Number(item.amount);
    } else {
      expense += Number(item.amount);
    }
  });
  return { income, expense, net: income - expense };
};

export function Funding() {
  const { call } = useRequest();
  const client = useQueryClient();
  const toast = useToast();
  const { isCoordinator, restUrl, nonce } = useBoot();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<FundingRecord | null>(null);

  const fundingQuery = useQuery({
    queryKey: ['funding'],
    queryFn: () => call<FundingResponse>('/funding')
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: any) =>
      editing ? call<FundingRecord>(`/funding/${editing.id}`, 'PUT', payload) : call<FundingRecord>('/funding', 'POST', payload),
    onMutate: async (payload: any) => {
      if (!isCoordinator) {
        throw new Error('Only coordinators can modify funding');
      }
      await client.cancelQueries({ queryKey: ['funding'] });
      const snapshot = client.getQueryData<FundingResponse>(['funding']);

      const optimisticId = editing?.id ?? Number.MIN_SAFE_INTEGER + Date.now();
      const optimisticRecord: FundingRecord = {
        id: optimisticId,
        type: payload.type,
        amount: Number(payload.amount),
        category: payload.category,
        note: payload.note,
        tx_date: payload.tx_date
      };

      client.setQueryData<FundingResponse>(['funding'], (previous) => {
        const base = previous ?? { data: [], summary: { income: 0, expense: 0, net: 0 } };
        const nextData = editing
          ? base.data.map((item) => (item.id === optimisticId ? optimisticRecord : item))
          : [optimisticRecord, ...base.data];
        return { data: nextData, summary: summarize(nextData) };
      });

      return { snapshot, optimisticId };
    },
    onError: (error: Error, _payload, context) => {
      if (context?.snapshot) {
        client.setQueryData(['funding'], context.snapshot);
      }
      toast(error.message || 'Unable to modify funding', 'error');
    },
    onSuccess: (record, _payload, context) => {
      client.setQueryData<FundingResponse>(['funding'], (previous) => {
        if (!previous) {
          return { data: [record], summary: summarize([record]) };
        }
        const nextData = previous.data.map((item) => (item.id === (context?.optimisticId ?? record.id) ? record : item));
        return { data: nextData, summary: summarize(nextData) };
      });
      toast(editing ? 'Funding updated' : 'Funding created', 'success');
      setIsOpen(false);
      setEditing(null);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['funding'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => call(`/funding/${id}`, 'DELETE'),
    onMutate: async (id: number) => {
      if (!isCoordinator) {
        throw new Error('Only coordinators can delete funding');
      }
      await client.cancelQueries({ queryKey: ['funding'] });
      const snapshot = client.getQueryData<FundingResponse>(['funding']);

      client.setQueryData<FundingResponse>(['funding'], (previous) => {
        if (!previous) {
          return previous;
        }
        const nextData = previous.data.filter((item) => item.id !== id);
        return { data: nextData, summary: summarize(nextData) };
      });

      return { snapshot };
    },
    onError: (error: Error, _id, context) => {
      if (context?.snapshot) {
        client.setQueryData(['funding'], context.snapshot);
      }
      toast(error.message || 'Unable to delete transaction', 'error');
    },
    onSuccess: () => {
      toast('Funding deleted', 'success');
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['funding'] });
    }
  });

  async function handleExport() {
    if (!isCoordinator) {
      toast('Only coordinators can export funding data', 'info');
      return;
    }
    const response = await fetch(`${restUrl}/funding/export`, {
      headers: {
        'X-WP-Nonce': nonce
      }
    });
    if (!response.ok) {
      toast('Export failed', 'error');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'l4p-funding.csv';
    link.click();
    toast('CSV downloaded', 'success');
  }

  function openForm(record?: FundingRecord) {
    if (!isCoordinator) {
      toast('Only coordinators can modify funding', 'info');
      return;
    }
    setEditing(record ?? null);
    setIsOpen(true);
  }

  return (
    <Card title="Funding Ledger" subtitle="Track income and expenses" isLoading={fundingQuery.isLoading}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Net balance</p>
          <p className="text-2xl font-bold text-[var(--l4p-primary)]">
            ${fundingQuery.data?.summary.net.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-accent)]"
          >
            Export CSV
          </button>
          <button
            onClick={() => openForm()}
            className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-accent)]"
          >
            Add Entry
          </button>
        </div>
      </div>
      <div className="mt-4 h-[420px] overflow-y-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(fundingQuery.data?.data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.tx_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.category}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">${Number(item.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.note}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openForm(item)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-primary)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        isCoordinator
                          ? deleteMutation.mutate({ id: item.id })
                          : toast('Only coordinators can delete funding', 'info')
                      }
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={setIsOpen} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="translate-y-6 opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">{editing ? 'Edit entry' : 'Add entry'}</Dialog.Title>
                  <FundingForm
                    initial={editing}
                    onSubmit={(values) => upsertMutation.mutate(values)}
                    onCancel={() => {
                      setIsOpen(false);
                      setEditing(null);
                    }}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Card>
  );
}

function FundingForm({
  initial,
  onSubmit,
  onCancel
}: {
  initial?: FundingRecord | null;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState(initial?.type ?? 'income');
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [category, setCategory] = useState(initial?.category ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.tx_date ?? new Date().toISOString().slice(0, 10));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({ type, amount: Number(amount), category, note, tx_date: date });
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-600">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as FundingRecord['type'])}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Category</label>
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Note</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Date</label>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--l4p-accent)]"
        >
          Save
        </button>
      </div>
    </form>
  );
}
