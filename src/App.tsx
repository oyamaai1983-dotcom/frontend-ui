import { useCallback, useEffect, useMemo, useState } from 'react';
import { AudioLines } from 'lucide-react';
import { AnalysisHistoryPanel } from './components/AnalysisHistoryPanel';
import { AnalysisResultPanel } from './components/AnalysisResultPanel';
import { CallInputPanel } from './components/CallInputPanel';
import { CriteriaPanel } from './components/CriteriaPanel';
import { StatusIndicator } from './components/StatusIndicator';
import {
  AnalysisHistoryItem,
  AnalysisResultData,
  AnalysisStatus,
  CriterionItem,
} from './types/analysis';
import { downloadAnalysisPdf } from './utils/pdf';

const ANALYZE_ENDPOINT = 'https://lesson-for-ui.onrender.com/analyze';
const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg'];
const MAX_HISTORY_ITEMS = 3;
const HISTORY_STORAGE_KEY = 'ai_call_analysis_history_v1';
const TEXT_COUNTER_STORAGE_KEY = 'ai_call_analysis_text_counter_v1';

const INITIAL_CRITERIA: CriterionItem[] = [
  { id: 'criterion-1', name: 'Приветствие' },
  { id: 'criterion-2', name: 'Выявление проблемы' },
  { id: 'criterion-3', name: 'Обработка возражений' },
];

const PROCESSING_WAIT_HINT = 'Идёт обработка, подождите';

interface AnalyzeApiResponse {
  status?: 'ok' | 'error' | string;
  analysis?: string;
  message?: string;
}

function loadInitialHistory(): AnalysisHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is AnalysisHistoryItem =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.createdAt === 'string' &&
          typeof item.analysisText === 'string',
      )
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function loadInitialTextCounter(): number {
  try {
    const raw = localStorage.getItem(TEXT_COUNTER_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function formatHistoryTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [criteria, setCriteria] = useState<CriterionItem[]>(INITIAL_CRITERIA);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);

  const [history, setHistory] = useState<AnalysisHistoryItem[]>(loadInitialHistory);
  const [textAnalysisCount, setTextAnalysisCount] = useState<number>(loadInitialTextCounter);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [criteriaHint, setCriteriaHint] = useState<string | null>(null);
  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const [historyHint, setHistoryHint] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(TEXT_COUNTER_STORAGE_KEY, String(textAnalysisCount));
    } catch {
      // Ignore storage quota errors
    }
  }, [textAnalysisCount]);

  const clearHints = useCallback(() => {
    setUploadError(null);
    setActionHint(null);
    setCriteriaHint(null);
    setPdfHint(null);
    setHistoryHint(null);
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (status === 'processing') {
        setActionHint(PROCESSING_WAIT_HINT);
        return;
      }

      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
        setUploadError('Неверный формат, загрузите mp3/wav/m4a/ogg');
        return;
      }

      clearHints();
      setSelectedFile(file);
      setPastedText('');
      setAnalysisResult(null);
      setActiveHistoryId(null);
      setStatus('received');
    },
    [status, clearHints],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      if (status === 'processing') {
        setActionHint(PROCESSING_WAIT_HINT);
        return;
      }

      clearHints();
      setSelectedFile(null);
      setPastedText(text);
      setAnalysisResult(null);
      setActiveHistoryId(null);
      setStatus(text.trim().length > 0 ? 'received' : 'idle');
    },
    [status, clearHints],
  );

  // Support Ctrl+V anywhere on the page when focus is outside inputs/textareas
  useEffect(() => {
    const handleWindowPaste = (e: ClipboardEvent) => {
      if (e.defaultPrevented) return;

      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      if (status === 'processing') {
        e.preventDefault();
        setActionHint(PROCESSING_WAIT_HINT);
        return;
      }

      const clipboardFile = e.clipboardData?.files?.[0];
      if (clipboardFile) {
        e.preventDefault();
        handleFileSelect(clipboardFile);
        return;
      }

      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (text.trim().length > 0) {
        e.preventDefault();
        handleTextChange(text);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [status, handleFileSelect, handleTextChange]);

  const handleClear = useCallback(() => {
    if (status === 'processing') {
      setActionHint(PROCESSING_WAIT_HINT);
      return;
    }

    clearHints();
    setSelectedFile(null);
    setPastedText('');
    setAnalysisResult(null);
    setActiveHistoryId(null);
    setStatus('idle');
  }, [status, clearHints]);

  const handleRunAnalysis = useCallback(async () => {
    if (status === 'processing') {
      setActionHint(PROCESSING_WAIT_HINT);
      return;
    }

    const trimmedText = pastedText.trim();
    const hasInput = Boolean(selectedFile) || trimmedText.length > 0;
    if (!hasInput) {
      setActionHint('Добавьте файл или вставьте текст');
      return;
    }

    const currentFile = selectedFile;
    const currentCriteriaNames = criteria.map((item) => item.name);

    clearHints();
    setAnalysisResult(null);
    setActiveHistoryId(null);
    setStatus('processing');

    try {
      const formData = new FormData();
      if (currentFile) {
        formData.append('file', currentFile);
      } else {
        formData.append('text', pastedText);
      }
      formData.append('criteria', JSON.stringify(currentCriteriaNames));

      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      let data: AnalyzeApiResponse | null = null;
      try {
        data = (await response.json()) as AnalyzeApiResponse;
      } catch {
        data = null;
      }

      if (!response.ok || data?.status === 'error' || data?.status !== 'ok') {
        const errorMessage =
          data?.message?.trim() ||
          `Не удалось выполнить анализ (HTTP ${response.status}).`;
        setStatus('received');
        setActionHint(errorMessage);
        return;
      }

      const analysisText =
        typeof data.analysis === 'string' ? data.analysis : '';

      let entryTitle: string;
      let sourceType: 'audio' | 'text';

      if (currentFile) {
        entryTitle = currentFile.name;
        sourceType = 'audio';
      } else {
        const nextNumber = textAnalysisCount + 1;
        setTextAnalysisCount(nextNumber);
        entryTitle = `Текстовый анализ #${nextNumber}`;
        sourceType = 'text';
      }

      const newHistoryItem: AnalysisHistoryItem = {
        id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: entryTitle,
        createdAt: formatHistoryTimestamp(new Date()),
        analysisText,
        sourceType,
        criteriaNames: currentCriteriaNames,
      };

      setHistory((prev) => [newHistoryItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
      setActiveHistoryId(newHistoryItem.id);
      setAnalysisResult({ rawText: analysisText });
      setStatus('done');
    } catch {
      setStatus('received');
      setActionHint(
        'Не удалось связаться с сервером анализа. Проверьте подключение и попробуйте снова.',
      );
    }
  }, [status, selectedFile, pastedText, criteria, textAnalysisCount, clearHints]);

  const handleProcessingBlocked = useCallback(() => {
    setActionHint(PROCESSING_WAIT_HINT);
  }, []);

  const handleAddCriterion = useCallback(
    (rawName: string): boolean => {
      if (status === 'processing') {
        setCriteriaHint(PROCESSING_WAIT_HINT);
        return false;
      }

      const trimmed = rawName.trim();
      if (!trimmed) {
        setCriteriaHint('Введите название критерия');
        return false;
      }

      setCriteriaHint(null);
      setCriteria((prev) => [
        ...prev,
        {
          id: `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: trimmed,
        },
      ]);
      return true;
    },
    [status],
  );

  const handleRemoveCriterion = useCallback(
    (id: string) => {
      if (status === 'processing') {
        setCriteriaHint(PROCESSING_WAIT_HINT);
        return;
      }

      setCriteriaHint(null);
      setCriteria((prev) => prev.filter((item) => item.id !== id));
    },
    [status],
  );

  const handleSelectHistoryItem = useCallback(
    (item: AnalysisHistoryItem) => {
      if (status === 'processing') {
        setHistoryHint(PROCESSING_WAIT_HINT);
        return;
      }

      clearHints();
      setActiveHistoryId(item.id);
      setAnalysisResult({ rawText: item.analysisText });
      setStatus('done');
    },
    [status, clearHints],
  );

  const activeHistoryItem = useMemo(
    () => history.find((item) => item.id === activeHistoryId) ?? null,
    [history, activeHistoryId],
  );

  const handleDownloadPdf = useCallback(async () => {
    if (status === 'processing') {
      setPdfHint(PROCESSING_WAIT_HINT);
      return;
    }

    if (status !== 'done' || !analysisResult) {
      setPdfHint('Сначала получите результат анализа');
      return;
    }

    const analysisText = analysisResult.rawText?.trim()
      ? analysisResult.rawText
      : 'Результат анализа получен (пустой текст).';

    const sourceLabel = activeHistoryItem
      ? activeHistoryItem.title
      : selectedFile
        ? selectedFile.name
        : 'Вставленный текст';

    const criteriaForPdf = activeHistoryItem
      ? activeHistoryItem.criteriaNames
      : criteria.map((item) => item.name);

    setPdfHint(null);
    try {
      await downloadAnalysisPdf({
        analysisText,
        sourceLabel,
        criteriaNames: criteriaForPdf,
      });
    } catch {
      setPdfHint('Не удалось сформировать PDF. Попробуйте ещё раз.');
    }
  }, [status, analysisResult, activeHistoryItem, selectedFile, criteria]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <AudioLines className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
              AI-анализ звонка
            </h1>
          </div>

          <StatusIndicator status={status} />
        </div>
      </header>

      {/* Main Single-Page Workspace */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8 md:px-10 md:py-10 space-y-6">
        {/* Top 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col">
            <CallInputPanel
              selectedFile={selectedFile}
              pastedText={pastedText}
              status={status}
              uploadError={uploadError}
              actionHint={actionHint}
              onFileSelect={handleFileSelect}
              onTextChange={handleTextChange}
              onClear={handleClear}
              onRunAnalysis={handleRunAnalysis}
              onProcessingBlocked={handleProcessingBlocked}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <CriteriaPanel
              criteria={criteria}
              criteriaHint={criteriaHint}
              onAddCriterion={handleAddCriterion}
              onRemoveCriterion={handleRemoveCriterion}
            />
          </div>
        </div>

        {/* Bottom Full-Width Analysis Result */}
        <AnalysisResultPanel
          status={status}
          result={analysisResult}
          resultTitle={activeHistoryItem?.title ?? null}
          resultTimestamp={activeHistoryItem?.createdAt ?? null}
          pdfHint={pdfHint}
          onDownloadPdf={handleDownloadPdf}
        />

        {/* Analysis History (max 3 recent items) */}
        <AnalysisHistoryPanel
          items={history}
          activeId={activeHistoryId}
          historyHint={historyHint}
          onSelectItem={handleSelectHistoryItem}
        />
      </main>
    </div>
  );
}
