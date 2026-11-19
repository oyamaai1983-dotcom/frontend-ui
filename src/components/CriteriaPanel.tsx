import React, { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { CriterionItem } from '../types/analysis';

interface CriteriaPanelProps {
  criteria: CriterionItem[];
  criteriaHint: string | null;
  onAddCriterion: (name: string) => boolean;
  onRemoveCriterion: (id: string) => void;
}

export function CriteriaPanel({
  criteria,
  criteriaHint,
  onAddCriterion,
  onRemoveCriterion,
}: CriteriaPanelProps) {
  const [newCriterion, setNewCriterion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const added = onAddCriterion(newCriterion);
    if (added) {
      setNewCriterion('');
    }
  };

  return (
    <section
      aria-labelledby="criteria-section-heading"
      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <h2
          id="criteria-section-heading"
          className="font-display text-lg font-semibold text-slate-900 tracking-tight"
        >
          Критерии
        </h2>
        <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
          {criteria.length} шт.
        </span>
      </div>

      {/* Criteria list */}
      <div className="mt-3 flex-1 overflow-y-auto">
        {criteria.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">Список критериев пуст</p>
            <p className="mt-1 text-xs text-slate-400">
              Добавьте критерий ниже, чтобы учитывать его при анализе
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {criteria.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5 group"
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-slate-800 break-words">
                    {item.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveCriterion(item.id)}
                  aria-label={`Удалить критерий «${item.name}»`}
                  className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add new criterion */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <label htmlFor="new-criterion-input" className="sr-only">
            Новый критерий
          </label>
          <input
            id="new-criterion-input"
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            placeholder="Новый критерий"
            className="flex-1 min-w-0 h-[42px] px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Добавить</span>
          </button>
        </form>

        {criteriaHint && (
          <div
            role="alert"
            className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{criteriaHint}</span>
          </div>
        )}
      </div>
    </section>
  );
}
