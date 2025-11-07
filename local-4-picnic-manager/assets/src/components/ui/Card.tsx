import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export function Card({ title, subtitle, isLoading, children }: CardProps) {
  return (
    <section className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-slate-100">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {isLoading && <span className="text-xs text-slate-400">Loading…</span>}
      </header>
      <div className={cn('space-y-4', isLoading && 'animate-pulse opacity-80')}>{children}</div>
    </section>
  );
}
