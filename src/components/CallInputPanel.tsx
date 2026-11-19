import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  FileAudio,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { AnalysisStatus } from '../types/analysis';

interface CallInputPanelProps {
  selectedFile: File | null;
  pastedText: string;
  status: AnalysisStatus;
  uploadError: string | null;
  actionHint: string | null;
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onClear: () => void;
  onRunAnalysis: () => void;
  onProcessingBlocked: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'AUDIO';
}

export function CallInputPanel({
  selectedFile,
  pastedText,
  status,
  uploadError,
  actionHint,
  onFileSelect,
  onTextChange,
  onClear,
  onRunAnalysis,
  onProcessingBlocked,
}: CallInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);

  const [isDragActive, setIsDragActive] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);

  const hasText = pastedText.length > 0;
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (!hasText && !selectedFile) {
      return;
    }
    if (selectedFile) {
      setIsTextMode(false);
    }
  }, [hasText, selectedFile]);

  const handleOpenFilePicker = () => {
    if (isProcessing) {
      onProcessingBlocked();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (isProcessing) {
      onProcessingBlocked();
      return;
    }
    onFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (!isProcessing) {
      setIsDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragActive(false);

    if (isProcessing) {
      onProcessingBlocked();
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
      return;
    }

    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText.trim()) {
      setIsTextMode(true);
      onTextChange(droppedText);
    }
  };

  const handleZonePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (isProcessing) {
      e.preventDefault();
      onProcessingBlocked();
      return;
    }

    const clipboardFile = e.clipboardData.files?.[0];
    if (clipboardFile) {
      e.preventDefault();
      onFileSelect(clipboardFile);
      return;
    }

    // Let textarea handle its own native paste so cursor/selection stays natural
    if (document.activeElement === textareaRef.current) {
      return;
    }

    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      setIsTextMode(true);
      onTextChange(text);
    }
  };

  const handleEnableTextMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isProcessing) {
      onProcessingBlocked();
      return;
    }
    setIsTextMode(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleClearClick = () => {
    if (isProcessing) {
      onProcessingBlocked();
      return;
    }
    setIsTextMode(false);
    onClear();
  };

  const showTextEditor = (isTextMode || hasText) && !selectedFile;

  return (
    <section
      aria-labelledby="input-section-heading"
      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <h2
          id="input-section-heading"
          className="font-display text-lg font-semibold text-slate-900 tracking-tight"
        >
          Запись или текст звонка
        </h2>

        <div className="text-xs text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
          {selectedFile ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium text-slate-700"
              title="Тип содержимого: аудиофайл"
            >
              <FileAudio
                className="w-4 h-4 text-blue-600 shrink-0"
                aria-label="Аудиофайл"
              />
              <span className="max-w-[200px] truncate">{selectedFile.name}</span>
            </span>
          ) : hasText ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium text-slate-700"
              title="Тип содержимого: текст"
            >
              <FileText
                className="w-4 h-4 text-blue-600 shrink-0"
                aria-label="Текст"
              />
              <span>Вставлен текст</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">
                {pastedText.length.toLocaleString('ru-RU')} симв.
              </span>
            </span>
          ) : isTextMode ? (
            <span
              className="inline-flex items-center gap-1.5 font-medium text-slate-700"
              title="Тип содержимого: текст"
            >
              <FileText
                className="w-4 h-4 text-blue-600 shrink-0"
                aria-label="Текст"
              />
              <span>Текстовый режим</span>
            </span>
          ) : (
            <span>Файл или текст не выбраны</span>
          )}
        </div>
      </div>

      {/* Main square-proportioned input field */}
      <div className="mt-5 flex-1 flex flex-col">
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Выбрать аудиофайл"
        />

        <div
          tabIndex={0}
          role={showTextEditor ? 'region' : 'button'}
          aria-label={
            showTextEditor
              ? 'Поле с текстом звонка'
              : 'Переместите сюда аудиофайл или нажмите для выбора файла, либо вставьте текст через Ctrl+V'
          }
          onClick={showTextEditor ? undefined : handleOpenFilePicker}
          onKeyDown={(e) => {
            if (!showTextEditor && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleOpenFilePicker();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handleZonePaste}
          className={`relative flex-1 min-h-[300px] sm:min-h-[330px] rounded-lg border border-dashed transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 flex flex-col ${
            isDragActive
              ? 'border-blue-600 bg-blue-50/50'
              : uploadError
                ? 'border-red-300 bg-red-50/20'
                : selectedFile || hasText
                  ? 'border-slate-300 bg-slate-50/60'
                  : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          {selectedFile ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <FileAudio className="w-6 h-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="inline-flex items-center justify-center gap-2 max-w-md">
                <span
                  className="inline-flex items-center justify-center shrink-0 text-blue-600"
                  title="Аудиофайл"
                >
                  <FileAudio className="w-4 h-4" aria-label="Аудиофайл" />
                </span>
                <p className="text-base font-medium text-slate-900 break-all">
                  {selectedFile.name}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>Аудио</span>
                <span aria-hidden="true">·</span>
                <span>{getFileExtension(selectedFile.name)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <p className="mt-5 text-xs text-slate-500">
                Нажмите на область или перетащите другой файл, чтобы заменить
              </p>
            </div>
          ) : showTextEditor ? (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between gap-3 pb-2.5 mb-2 border-b border-slate-200/80">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700"
                  title="Текст"
                >
                  <FileText
                    className="w-4 h-4 text-blue-600 shrink-0"
                    aria-label="Текст"
                  />
                  <span>{hasText ? 'Вставлен текст' : 'Расшифровка звонка'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleOpenFilePicker}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Выбрать аудиофайл
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={pastedText}
                readOnly={isProcessing}
                onChange={(e) => {
                  if (isProcessing) {
                    onProcessingBlocked();
                    return;
                  }
                  onTextChange(e.target.value);
                }}
                placeholder="Вставьте сюда расшифровку звонка (Ctrl+V) или введите текст..."
                className="flex-1 w-full resize-none bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-4">
                <Upload className="w-5 h-5 text-slate-600" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-slate-900 max-w-xs leading-snug">
                Переместите сюда аудиофайл и получите анализ звонка
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Форматы: mp3, wav, m4a, ogg
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                <span>Нажмите для выбора файла</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleEnableTextMode}
                  className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Вставить текст (Ctrl+V)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* File format error hint right by the upload field */}
        {uploadError && (
          <div
            role="alert"
            className="mt-2.5 flex items-center gap-2 text-xs font-medium text-red-600"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRunAnalysis}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>Запустить анализ</span>
        </button>

        <button
          type="button"
          onClick={handleClearClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <RotateCcw className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          <span>Очистить</span>
        </button>

        {actionHint && (
          <div
            role="alert"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{actionHint}</span>
          </div>
        )}
      </div>
    </section>
  );
}
