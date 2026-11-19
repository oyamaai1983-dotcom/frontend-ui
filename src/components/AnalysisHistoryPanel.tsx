import { AlertCircle, CheckCircle2, FileAudio, FileText, History } from 'lucide-react';
import { AnalysisHistoryItem } from '../types/analysis';

interface AnalysisHistoryPanelProps {
  items: AnalysisHistoryItem[];
  activeId: string | null;
  historyHint: string | null;
  onSelectItem: (item: AnalysisHistoryItem) => void;
}

export function AnalysisHistoryPanel({
  items,
  activeId,
  historyHint,
  onSelectItem,
}: AnalysisHistoryPanelProps) {
  return (
    <section
      aria-labelledby="history-section-heading"
      className="bg-white border border-slate-200 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <h2
            id="history-section-heading"
            className="font-display text-lg font-semibold text-slate-900 tracking-tight"
          >
            История анализов
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {historyHint && (
            <div
              role="alert"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{historyHint}</span>
            </div>
          )}
          <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
            {items.length} / 3
          </span>
        </div>
      </div>

      {/* Cards list (up to 3 items) */}
      <div className="mt-5">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              История анализов пока пуста
            </p>
            <p className="mt-1 text-xs text-slate-400">
              После успешного анализа здесь сохранятся до трёх последних результатов
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item) => {
              const isActive = item.id === activeId;
              const TypeIcon = item.sourceType === 'audio' ? FileAudio : FileText;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  aria-pressed={isActive}
                  className={`text-left rounded-lg border p-4 transition-colors duration-150 cursor-pointer flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <TypeIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item.sourceType === 'audio' ? 'Аудио' : 'Текст'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.createdAt}</span>
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Открыт</span>
                        </span>
                      )}
                    </div>

                    <p
                      className="text-sm font-semibold text-slate-900 truncate"
                      title={item.title}
                    >
                      {item.title}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed break-words">
                    {item.analysisText.trim() || 'Пустой текст результата'}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
