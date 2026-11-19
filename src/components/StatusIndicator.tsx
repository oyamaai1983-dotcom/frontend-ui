import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { AnalysisStatus } from '../types/analysis';

interface StatusIndicatorProps {
  status: AnalysisStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (status === 'processing') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 whitespace-nowrap shrink-0"
      >
        <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" aria-hidden="true" />
        <span>Обрабатываю…</span>
      </div>
    );
  }

  if (status === 'received') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 whitespace-nowrap shrink-0"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Получили</span>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 whitespace-nowrap shrink-0"
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Готово</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap shrink-0"
    >
      <Clock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <span>Ожидание данных</span>
    </div>
  );
}
