import { AlertCircle, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { AnalysisResultData, AnalysisStatus } from '../types/analysis';

interface AnalysisResultPanelProps {
  status: AnalysisStatus;
  result: AnalysisResultData | null;
  resultTitle?: string | null;
  resultTimestamp?: string | null;
  pdfHint: string | null;
  onDownloadPdf: () => void;
}

export function AnalysisResultPanel({
  status,
  result,
  resultTitle,
  resultTimestamp,
  pdfHint,
  onDownloadPdf,
}: AnalysisResultPanelProps) {
  return (
    <section aria-labelledby="result-section-heading" className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
            <h2
              id="result-section-heading"
              className="font-display text-lg font-semibold text-slate-900 tracking-tight"
            >
              Результат анализа
            </h2>

            {status === 'done' && resultTitle && (
              <span className="text-xs text-slate-500 truncate max-w-[320px]">
                {resultTitle}
                {resultTimestamp ? ` · ${resultTimestamp}` : ''}
              </span>
            )}
          </div>

          {status === 'processing' && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
              <span>Обрабатываю…</span>
            </div>
          )}

          {status === 'done' && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Готово</span>
            </div>
          )}
        </div>

        {/* Empty / Processing / Future Result container */}
        <div className="mt-5">
          {status === 'processing' ? (
            <div className="min-h-[220px] rounded-lg border border-slate-200 bg-slate-50/70 p-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-3" aria-hidden="true" />
              <p className="text-base font-medium text-slate-900">Обрабатываю…</p>
              <p className="mt-1 text-sm text-slate-500 max-w-md">
                Данные приняты в работу. После завершения здесь появится отчёт по выбранным критериям.
              </p>
            </div>
          ) : status === 'done' && result ? (
            <div className="min-h-[220px] rounded-lg border border-slate-200 bg-white p-6 space-y-4">
              {typeof result.rawText === 'string' && (
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
                  {result.rawText || 'Анализ завершён, но сервер вернул пустой текст.'}
                </div>
              )}

              {result.summary && (
                <div>
                  <h3 className="text-xs font-medium text-slate-500 mb-1.5">Резюме звонка</h3>
                  <p className="text-sm text-slate-800 leading-relaxed">{result.summary}</p>
                </div>
              )}

              {result.evaluations && result.evaluations.length > 0 && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {result.evaluations.map((item, idx) => (
                    <div key={idx} className="py-3.5">
                      <p className="text-sm font-medium text-slate-900">{item.criterion}</p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[220px] rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-700">
                Загрузите файл или вставьте текст и запустите анализ
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Здесь отобразится структурированный разбор звонка после обработки
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Download PDF bar below the block */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <FileDown className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
          <span>Скачать PDF</span>
        </button>

        {pdfHint && (
          <div
            role="alert"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{pdfHint}</span>
          </div>
        )}
      </div>
    </section>
  );
}
