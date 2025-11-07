import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Transition } from '@headlessui/react';
import { cn } from '../utils/cn';

type Toast = {
  id: number;
  message: string;
  tone?: 'success' | 'error' | 'info';
};

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const toast = { id: Date.now(), message, tone };
    setToasts((current) => [...current, toast]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-80 flex-col space-y-2">
        {toasts.map((toast) => (
          <Transition
            key={toast.id}
            appear
            show
            enter="transition duration-200"
            enterFrom="translate-y-2 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={cn(
                'rounded-xl bg-card p-4 shadow-soft ring-1 ring-slate-200',
                toast.tone === 'success' && 'border-l-4 border-success',
                toast.tone === 'error' && 'border-l-4 border-red-500',
                toast.tone === 'info' && 'border-l-4 border-primary'
              )}
            >
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
          </Transition>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
