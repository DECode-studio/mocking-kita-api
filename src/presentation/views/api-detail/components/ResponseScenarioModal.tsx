'use client';

import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Sparkles } from 'lucide-react';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { API_DETAIL_TEXT, API_DETAIL_SEMANTIC_ID } from '../constant';
import { formatJsonString } from '@/src/core/utils/json';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ResponseScenarioModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRespScenario: ResponseScenario | null;
  onSubmit: (data: {
    name: string;
    statusCode: number;
    priority: number;
    weight: number;
    body: string;
    delayMs: number;
    status: boolean;
    responseType: 'JSON' | 'FILE';
    filePath?: string | null;
    fileName?: string | null;
  }) => void;
  onUploadFile: (file: File) => Promise<{ filePath: string; fileName: string }>;
}

export const ResponseScenarioModal: React.FC<ResponseScenarioModalProps> = ({
  isOpen,
  onOpenChange,
  editingRespScenario,
  onSubmit,
  onUploadFile,
}) => {
  const [name, setName] = useState('');
  const [statusCode, setStatusCode] = useState(200);
  const [priority, setPriority] = useState(100);
  const [weight, setWeight] = useState(100);
  const [body, setBody] = useState('{\n  "message": "Success"\n}');
  const [delayMs, setDelayMs] = useState(0);
  const [status, setStatus] = useState(true);

  // File Upload states
  const [responseType, setResponseType] = useState<'JSON' | 'FILE'>('JSON');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (editingRespScenario) {
      setName(editingRespScenario.name);
      setStatusCode(editingRespScenario.statusCode);
      setPriority(editingRespScenario.priority || 100);
      setWeight(editingRespScenario.weight || 100);
      setBody(typeof editingRespScenario.body === 'string' ? editingRespScenario.body : JSON.stringify(editingRespScenario.body || {}, null, 2));
      setDelayMs(editingRespScenario.delayMs);
      setStatus(editingRespScenario.status);
      setResponseType(editingRespScenario.responseType || 'JSON');
      setFilePath(editingRespScenario.filePath || null);
      setFileName(editingRespScenario.fileName || null);
    } else {
      setName('');
      setStatusCode(200);
      setPriority(100);
      setWeight(100);
      setBody('{\n  "message": "Success"\n}');
      setDelayMs(0);
      setStatus(true);
      setResponseType('JSON');
      setFilePath(null);
      setFileName(null);
    }
  }, [editingRespScenario, isOpen]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await onUploadFile(file);
      setFilePath(data.filePath);
      setFileName(data.fileName);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      statusCode: Number(statusCode) || 200,
      priority: Number(priority) || 100,
      weight: Number(weight) || 100,
      body,
      delayMs: Number(delayMs) || 0,
      status,
      responseType,
      filePath,
      fileName,
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50" />
        <Dialog.Content id={API_DETAIL_SEMANTIC_ID.RESP_MODAL} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl z-50 space-y-4 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingRespScenario ? API_DETAIL_TEXT.MODAL_RESP_EDIT_TITLE : API_DETAIL_TEXT.MODAL_RESP_ADD_TITLE}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Response Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 200 OK Response"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_STATUS_CODE}
                </label>
                <input
                  type="number"
                  required
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value))}
                  placeholder="200"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {API_DETAIL_TEXT.LABEL_DELAY}
                </label>
                <input
                  type="number"
                  min={0}
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  min={0}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Response Type Selector */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Response Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setResponseType('JSON')}
                  className={`py-1.5 text-center font-medium rounded-md transition-all ${
                    responseType === 'JSON'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  JSON Payload
                </button>
                <button
                  type="button"
                  onClick={() => setResponseType('FILE')}
                  className={`py-1.5 text-center font-medium rounded-md transition-all ${
                    responseType === 'FILE'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  File Response
                </button>
              </div>
            </div>

            {/* Response Content Area */}
            {responseType === 'FILE' ? (
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Response File
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-550/10 dark:bg-indigo-950/20'
                      : filePath
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500'
                  }`}
                >
                  {isUploading ? (
                    <div className="space-y-2 flex flex-col items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 dark:text-slate-400">Uploading file...</span>
                    </div>
                  ) : filePath ? (
                    <div className="space-y-3 py-2">
                      <div className="inline-flex items-center justify-center p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs mx-auto">{fileName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Uploaded successfully</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilePath(null);
                          setFileName(null);
                        }}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2 py-4">
                      <div className="inline-flex items-center justify-center p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Click to upload</span>
                        <span className="text-slate-500 dark:text-slate-400"> or drag and drop</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Supports PDF, PNG, JPG, ZIP, CSV, MP3, MP4 etc.</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleFileUpload(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    {API_DETAIL_TEXT.LABEL_RESPONSE_BODY}
                  </label>
                  <button
                    type="button"
                    onClick={() => setBody(formatJsonString(body))}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Beautify
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">{API_DETAIL_TEXT.LABEL_ACTIVE_STATUS}</label>
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md"
              >
                {API_DETAIL_TEXT.BTN_CANCEL}
              </button>
              <button
                type="submit"
                disabled={responseType === 'FILE' && !filePath && !isUploading}
                className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRespScenario ? API_DETAIL_TEXT.BTN_SAVE : API_DETAIL_TEXT.BTN_CREATE}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

