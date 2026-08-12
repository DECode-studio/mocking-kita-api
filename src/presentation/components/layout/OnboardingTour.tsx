'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { type OnboardingProgress, useOnboardingStore } from '../../stores/onboardingStore';
import { useUIStore } from '../../stores/uiStore';
import { PROJECTS_SEMANTIC_ID } from '../../views/projects/constant';
import { API_COLLECTIONS_SEMANTIC_ID } from '../../views/api-collections/constant';
import { API_DETAIL_SEMANTIC_ID } from '../../views/api-detail/constant';

type ActiveModal = 'project' | 'api' | 'reqScenario' | 'respScenario' | null;
type TourMode = 'click' | 'fill' | 'hold';

type AdvanceCheck = {
  allowed: boolean;
  reason?: string;
};

type TourStep = {
  id: string;
  target: string;
  mode: TourMode;
  content: string;
  title?: string;
  optional?: boolean;
};

type RectLayout = {
  rect: DOMRect;
  tooltipTop: number;
  tooltipLeft: number;
  tooltipWidth: number;
  tooltipPlacement: 'top' | 'bottom';
};

type StepStatus = 'completed' | 'active' | 'pending';
type OnboardingProgressKey = keyof OnboardingProgress;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const tooltipWidthFor = (viewportWidth: number) => clamp(Math.round(viewportWidth * 0.36), 300, 420);
const tooltipHeightEstimate = 230;
const COACH_MARK_STEP_IDS_KEY = 'mock_api_studio_coach_mark_completed_step_ids';

const HOLD_STEP_TO_PROGRESS_KEY: Record<string, OnboardingProgressKey> = {
  'project-submit': 'createProject',
  'api-submit': 'addApi',
  'req-submit': 'createRequestScenario',
  'resp-submit': 'createResponseScenario',
};

const RigidTooltip: React.FC<{
  step: TourStep;
  index: number;
  total: number;
  completedStepIds: string[];
  canAdvance: AdvanceCheck;
  onBack: () => void;
  onNext: () => void;
  onPass?: () => void;
  onSkip: () => void;
}> = ({ step, index, total, completedStepIds, canAdvance, onBack, onNext, onPass, onSkip }) => {
  const showNext = step.mode === 'fill';
  const showBack = index > 0;
  const showPass = step.mode === 'fill' && step.optional;

  return (
    <div
      className="fixed z-10001 rounded-2xl border border-slate-700/60 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-md pointer-events-auto"
      style={{
        width: 'min(420px, calc(100vw - 32px))',
        padding: '18px',
      }}
    >
      <div key={step.id} className="flex items-start justify-between gap-4 animate-tooltip-fade">
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Step {index + 1} of {total}
          </div>
          {step.title ? (
            <div className="text-sm font-semibold text-slate-50">{step.title}</div>
          ) : null}
          <p className="text-sm leading-6 text-slate-200">{step.content}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }, (_, stepIndex) => {
            const state: StepStatus =
              stepIndex < index ? 'completed' : stepIndex === index ? 'active' : 'pending';

            return (
              <span
                key={`${step.id}-${stepIndex}`}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  state === 'completed'
                    ? 'bg-emerald-400'
                    : state === 'active'
                      ? 'bg-indigo-400'
                      : completedStepIds.includes(step.id) && stepIndex === index
                        ? 'bg-indigo-300'
                        : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Rigid flow</span>
          <span>{completedStepIds.length} completed</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSkip();
          }}
          className="mr-auto py-1.5 text-xs font-semibold text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
        >
          Skip tour
        </button>
        {showBack && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            Back
          </button>
        )}
        {showPass && onPass && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPass();
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Pass
          </button>
        )}
        {showNext && (
          <button
            type="button"
            disabled={!canAdvance.allowed}
            title={canAdvance.allowed ? 'Lanjut' : canAdvance.reason}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNext();
            }}
            className="rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

const SpotlightFrame: React.FC<{ rect: DOMRect }> = ({ rect }) => (
  <>
    {/* Soft glowing ambient background pulse */}
    <div
      aria-hidden="true"
      className="fixed z-9997 rounded-2xl pointer-events-none mix-blend-screen"
      style={{
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        boxShadow: '0 0 25px 6px rgba(99, 102, 241, 0.45), 0 0 50px 12px rgba(168, 85, 247, 0.25)',
        animation: 'spotlight-glow-pulse 2.5s infinite ease-in-out',
        transition: 'top 0.5s cubic-bezier(0.16, 1, 0.3, 1), left 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    />

    {/* SVG Animated Border */}
    <svg
      aria-hidden="true"
      className="fixed inset-0 z-10000 pointer-events-none"
    >
      <defs>
        <linearGradient id="spotlight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Outer soft glow border */}
      <rect
        x={rect.left - 2}
        y={rect.top - 2}
        width={rect.width + 4}
        height={rect.height + 4}
        rx="16"
        ry="16"
        fill="none"
        stroke="url(#spotlight-grad)"
        strokeWidth="4"
        opacity="0.35"
        style={{
          filter: 'blur(2px)',
          transition: 'x 0.5s cubic-bezier(0.16, 1, 0.3, 1), y 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Crisp crawling dashed border */}
      <rect
        x={rect.left - 2}
        y={rect.top - 2}
        width={rect.width + 4}
        height={rect.height + 4}
        rx="16"
        ry="16"
        fill="none"
        stroke="url(#spotlight-grad)"
        strokeWidth="2.5"
        style={{
          strokeDasharray: '24 8',
          animation: 'spotlight-dash-shift 25s infinite linear',
          transition: 'x 0.5s cubic-bezier(0.16, 1, 0.3, 1), y 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </svg>

    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes spotlight-glow-pulse {
        0%, 100% {
          opacity: 0.35;
          transform: scale(0.99);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.01);
        }
      }
      @keyframes spotlight-dash-shift {
        to {
          stroke-dashoffset: -1000;
        }
      }
      @keyframes tooltip-fade {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-tooltip-fade {
        animation: tooltip-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `}} />
  </>
);

const BackdropSlice: React.FC<React.CSSProperties & { onBlock: () => void }> = ({ onBlock, ...style }) => (
  <div
    aria-hidden="true"
    role="presentation"
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onBlock();
    }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onBlock();
    }}
    className="fixed z-9999 bg-slate-950/55 pointer-events-auto"
    style={{
      ...style,
      transition: 'top 0.5s cubic-bezier(0.16, 1, 0.3, 1), left 0.5s cubic-bezier(0.16, 1, 0.3, 1), right 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}
  />
);

export const OnboardingTour: React.FC = () => {
  const pathname = usePathname();
  const { progress, tourActive, completedAll, isInitialized, initialize, completeStep, disableTour } = useOnboardingStore();
  const { addToast } = useUIStore();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [requestBodyType, setRequestBodyType] = useState<'JSON' | 'FORM_DATA' | 'URL_ENCODED' | 'NONE'>('JSON');
  const [responseTypeMode, setResponseTypeMode] = useState<'JSON' | 'FILE'>('JSON');
  const [projectCreatedDuringTour, setProjectCreatedDuringTour] = useState(false);
  const [apiCreatedDuringTour, setApiCreatedDuringTour] = useState(false);
  const [reqScenarioCreatedDuringTour, setReqScenarioCreatedDuringTour] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [isCoachMarkHydrated, setIsCoachMarkHydrated] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<RectLayout | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef<TourStep[]>([]);
  const elevatedTargetRef = useRef<{
    element: HTMLElement;
    position: string;
    zIndex: string;
    pointerEvents: string;
    isolation: string;
  } | null>(null);
  const coachMarkHydratedRef = useRef(false);

  const deriveCompletedStepIds = (savedProgress: OnboardingProgress) =>
    Object.entries(savedProgress)
      .filter(([, status]) => status === 'completed')
      .map(([key]) => key);

  const getValue = (selector: string) => {
    const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
    return element?.value?.trim() ?? '';
  };

  const isChecked = (selector: string) => {
    const element = document.querySelector<HTMLInputElement>(selector);
    return !!element?.checked;
  };

  const hasFilledObjectEditor = (prefix: string) => {
    const rawEditor = document.querySelector<HTMLTextAreaElement>(`#${prefix}-raw-textarea`);
    if (rawEditor) {
      const value = rawEditor.value.trim();
      return value !== '' && value !== '{}';
    }

    const keyInput = document.querySelector<HTMLInputElement>(`#${prefix}-row-0-key`);
    const valueInput = document.querySelector<HTMLInputElement>(`#${prefix}-row-0-value`);
    if (!keyInput || !valueInput) return false;
    return keyInput.value.trim() !== '' && valueInput.value.trim() !== '';
  };

  const canAdvance = (step: TourStep | undefined): AdvanceCheck => {
    if (!step) return { allowed: true };

    switch (step.target) {
      case `#${PROJECTS_SEMANTIC_ID.FORM_INPUT_NAME}`:
        return getValue(step.target).length >= 3
          ? { allowed: true }
          : { allowed: false, reason: 'Isi nama project minimal 3 karakter dulu.' };
      case `#${PROJECTS_SEMANTIC_ID.FORM_TEXTAREA_DESC}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Isi deskripsi project sebelum lanjut.' };
      case `#${PROJECTS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}`:
        return isChecked(step.target)
          ? { allowed: true }
          : { allowed: false, reason: 'Aktifkan status project sebelum lanjut.' };
      case `#${API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_NAME}`:
        return getValue(step.target).length >= 2
          ? { allowed: true }
          : { allowed: false, reason: 'Isi nama endpoint API dulu.' };
      case `#${API_COLLECTIONS_SEMANTIC_ID.FORM_SELECT_METHOD}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Pilih HTTP method dulu.' };
      case `#${API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_PATH}`:
        return getValue(step.target).startsWith('/')
          ? { allowed: true }
          : { allowed: false, reason: 'Path harus diisi dan diawali dengan /.' };
      case `#${API_COLLECTIONS_SEMANTIC_ID.FORM_TEXTAREA_DESC}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Isi deskripsi endpoint sebelum lanjut.' };
      case `#${API_COLLECTIONS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}`:
        return isChecked(step.target)
          ? { allowed: true }
          : { allowed: false, reason: 'Aktifkan endpoint sebelum lanjut.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_INPUT_NAME}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Isi nama request scenario dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_PRIORITY}`:
        return Number(getValue(step.target)) > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Priority harus lebih besar dari 0.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_QUERY_PARAMS}`:
        return hasFilledObjectEditor(API_DETAIL_SEMANTIC_ID.REQ_FORM_QUERY_PARAMS)
          ? { allowed: true }
          : { allowed: false, reason: 'Isi minimal satu query param key/value dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_HEADERS}`:
        return hasFilledObjectEditor(API_DETAIL_SEMANTIC_ID.REQ_FORM_HEADERS)
          ? { allowed: true }
          : { allowed: false, reason: 'Isi minimal satu header key/value dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY_TYPE}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Pilih tipe request body dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY}`:
        return requestBodyType === 'NONE' || hasFilledObjectEditor(API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY)
          ? { allowed: true }
          : { allowed: false, reason: 'Isi body matching request dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_STATUS}`:
        return isChecked(step.target)
          ? { allowed: true }
          : { allowed: false, reason: 'Aktifkan request scenario sebelum lanjut.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_INPUT_NAME}`:
        return getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Isi nama response scenario dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_STATUS_CODE}`:
        return Number(getValue(step.target)) >= 100
          ? { allowed: true }
          : { allowed: false, reason: 'Masukkan status code yang valid.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_PRIORITY}`:
        return Number(getValue(step.target)) >= 0
          ? { allowed: true }
          : { allowed: false, reason: 'Priority harus bernilai angka.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_WEIGHT}`:
        return Number(getValue(step.target)) >= 0
          ? { allowed: true }
          : { allowed: false, reason: 'Weight harus bernilai angka.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_TYPE_JSON}`:
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_TYPE_FILE}`:
        return { allowed: true };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_BODY}`:
        return responseTypeMode === 'FILE' || getValue(step.target).length > 0
          ? { allowed: true }
          : { allowed: false, reason: 'Isi body response dulu.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_FILE_UPLOAD}`:
        return document
          .querySelector(`#${API_DETAIL_SEMANTIC_ID.RESP_FORM_FILE_UPLOAD}`)
          ?.getAttribute('data-file-uploaded') === 'true'
          ? { allowed: true }
          : { allowed: false, reason: 'Upload file response dulu sebelum lanjut.' };
      case `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_STATUS}`:
        return isChecked(step.target)
          ? { allowed: true }
          : { allowed: false, reason: 'Aktifkan response scenario sebelum lanjut.' };
      default:
        return { allowed: true };
    }
  };

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined' || coachMarkHydratedRef.current) {
      return;
    }

    coachMarkHydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(COACH_MARK_STEP_IDS_KEY);
      if (!raw) {
        setCompletedStepIds(deriveCompletedStepIds(progress));
        setIsCoachMarkHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      const savedCompletedIds = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];

      setCompletedStepIds(savedCompletedIds.length > 0 ? savedCompletedIds : deriveCompletedStepIds(progress));
    } catch {
      window.localStorage.removeItem(COACH_MARK_STEP_IDS_KEY);
      setCompletedStepIds(deriveCompletedStepIds(progress));
    } finally {
      setIsCoachMarkHydrated(true);
    }
  }, [isInitialized, progress]);

  useEffect(() => {
    if (!isInitialized || !isCoachMarkHydrated || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(COACH_MARK_STEP_IDS_KEY, JSON.stringify(completedStepIds));
    } catch {
      // Ignore storage failures and keep the guidance functional.
    }
  }, [completedStepIds, isCoachMarkHydrated, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !isCoachMarkHydrated || typeof window === 'undefined') return;

    const allPending = Object.values(progress).every((value) => value === 'not-started');
    if (!allPending) return;

    setCompletedStepIds([]);
    try {
      window.localStorage.removeItem(COACH_MARK_STEP_IDS_KEY);
    } catch {
      // Ignore storage failures and keep the guidance functional.
    }
  }, [isCoachMarkHydrated, isInitialized, progress]);

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!tourActive || !isInitialized) return;

    const detectState = () => {
      if (document.getElementById(PROJECTS_SEMANTIC_ID.FORM_MODAL)) {
        setActiveModal('project');
      } else if (document.getElementById(API_COLLECTIONS_SEMANTIC_ID.FORM_MODAL)) {
        setActiveModal('api');
      } else if (document.getElementById(API_DETAIL_SEMANTIC_ID.REQ_MODAL)) {
        setActiveModal('reqScenario');
      } else if (document.getElementById(API_DETAIL_SEMANTIC_ID.RESP_MODAL)) {
        setActiveModal('respScenario');
      } else {
        setActiveModal(null);
      }

      const reqBodyType = document.querySelector<HTMLSelectElement>(`#${API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY_TYPE}`)?.value;
      if (reqBodyType === 'JSON' || reqBodyType === 'FORM_DATA' || reqBodyType === 'URL_ENCODED' || reqBodyType === 'NONE') {
        setRequestBodyType(reqBodyType);
      }

      const respType = document.querySelector<HTMLElement>('[data-tour-response-type]')?.getAttribute('data-tour-response-type');
      if (respType === 'JSON' || respType === 'FILE') {
        setResponseTypeMode(respType);
      }
    };

    detectState();
    const interval = window.setInterval(detectState, 250);
    return () => window.clearInterval(interval);
  }, [tourActive, isInitialized]);

  useEffect(() => {
    if (activeModal === 'project') setProjectCreatedDuringTour(true);
    if (activeModal === 'api') setApiCreatedDuringTour(true);
    if (activeModal === 'reqScenario') setReqScenarioCreatedDuringTour(true);
  }, [activeModal]);

  useEffect(() => {
    if (tourActive && progress.createProject === 'not-started') {
      setProjectCreatedDuringTour(false);
      setApiCreatedDuringTour(false);
      setReqScenarioCreatedDuringTour(false);
    }
  }, [tourActive, progress.createProject]);

  const builtSteps = useMemo<TourStep[]>(() => {
    if (!isInitialized || !tourActive) return [];

    const nextSteps: TourStep[] = [];

    if (pathname === '/dashboard' && progress.dashboardNavigated === 'not-started') {
      nextSteps.push({
        id: 'dashboard-projects-link',
        target: '#sidebar-projects-link',
        mode: 'click',
        content: 'Langkah pertama: buka menu Projects di sidebar untuk masuk ke area pengelolaan project.',
      });
    }

    if (pathname === '/projects') {
      if (progress.dashboardNavigated === 'not-started') {
        completeStep('dashboardNavigated');
      }

      if (progress.createProject === 'not-started') {
        if (activeModal === 'project') {
          nextSteps.push(
            {
              id: 'project-name',
              target: `#${PROJECTS_SEMANTIC_ID.FORM_INPUT_NAME}`,
              mode: 'fill',
              content: 'Isi nama project terlebih dahulu. Ini adalah identitas utama project mock kamu.',
            },
            {
              id: 'project-desc',
              target: `#${PROJECTS_SEMANTIC_ID.FORM_TEXTAREA_DESC}`,
              mode: 'fill',
              content: 'Tambahkan deskripsi project agar mudah dikenali saat jumlah project mulai banyak.',
              optional: true,
            },
            {
              id: 'project-status',
              target: `#${PROJECTS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}`,
              mode: 'fill',
              content: 'Pastikan status project aktif sebelum disimpan.',
            },
            {
              id: 'project-submit',
              target: `#${PROJECTS_SEMANTIC_ID.FORM_FOOTER}`,
              mode: 'hold',
              content: 'Kalau semua data sudah benar, klik Create Project di area ini. Setelah project tersimpan, saya akan lanjut otomatis.',
            }
          );
        } else if (projectCreatedDuringTour) {
          nextSteps.push({
            id: 'project-item',
            target: '[data-tour="project-item"]',
            mode: 'click',
            content: 'Project sudah dibuat. Klik item project ini untuk masuk ke halaman detail project.',
          });
        } else {
          nextSteps.push({
            id: 'project-add',
            target: `#${PROJECTS_SEMANTIC_ID.ADD_PROJECT_BTN}`,
            mode: 'click',
            content: 'Klik tombol Add Project untuk membuka modal pembuatan project.',
          });
        }
      }
    }

    if (pathname.startsWith('/projects/') && !pathname.includes('/apis/')) {
      if (progress.createProject === 'not-started') {
        completeStep('createProject');
      }

      if (progress.addApi === 'not-started') {
        if (activeModal === 'api') {
          nextSteps.push(
            {
              id: 'api-name',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_NAME}`,
              mode: 'fill',
              content: 'Isi nama endpoint API yang deskriptif.',
            },
            {
              id: 'api-method',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_SELECT_METHOD}`,
              mode: 'fill',
              content: 'Pilih HTTP method yang dipakai endpoint ini.',
            },
            {
              id: 'api-path',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_INPUT_PATH}`,
              mode: 'fill',
              content: 'Tentukan path endpoint, misalnya /users atau /orders.',
            },
            {
              id: 'api-desc',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_TEXTAREA_DESC}`,
              mode: 'fill',
              content: 'Tambahkan deskripsi singkat untuk dokumentasi internal.',
              optional: true,
            },
            {
              id: 'api-status',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_CHECKBOX_STATUS}`,
              mode: 'fill',
              content: 'Pastikan endpoint aktif sebelum disimpan.',
            },
            {
              id: 'api-submit',
              target: `#${API_COLLECTIONS_SEMANTIC_ID.FORM_FOOTER}`,
              mode: 'hold',
              content: 'Kalau endpoint sudah benar, klik Create API di area ini. Setelah tersimpan, saya lanjut otomatis.',
            }
          );
        } else if (apiCreatedDuringTour) {
          nextSteps.push({
            id: 'api-item',
            target: '[data-tour="api-item"]',
            mode: 'click',
            content: 'Endpoint sudah dibuat. Klik item API ini untuk masuk ke halaman detail konfigurasi API.',
          });
        } else {
          nextSteps.push({
            id: 'api-add',
            target: `#${API_COLLECTIONS_SEMANTIC_ID.ADD_BTN}`,
            mode: 'click',
            content: 'Klik tombol Add API untuk membuka modal pembuatan endpoint.',
          });
        }
      }
    }

    if (pathname.includes('/apis/')) {
      if (progress.addApi === 'not-started') {
        completeStep('addApi');
      }

      if (progress.createRequestScenario === 'not-started') {
        if (activeModal === 'reqScenario') {
          nextSteps.push(
            {
              id: 'req-name',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_INPUT_NAME}`,
              mode: 'fill',
              content: 'Isi nama request scenario terlebih dahulu.',
            },
            {
              id: 'req-priority',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_PRIORITY}`,
              mode: 'fill',
              content: 'Tentukan prioritas matching request ini. Angka lebih kecil berarti lebih prioritas.',
            },
            {
              id: 'req-query',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_QUERY_PARAMS}`,
              mode: 'fill',
              content: 'Atur query params yang harus cocok saat request masuk.',
              optional: true,
            },
            {
              id: 'req-headers',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_HEADERS}`,
              mode: 'fill',
              content: 'Atur header matching yang wajib ada pada request.',
              optional: true,
            },
            {
              id: 'req-body-type',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY_TYPE}`,
              mode: 'fill',
              content: 'Pilih tipe body request yang ingin dicocokkan.',
            },
            ...(requestBodyType === 'NONE'
              ? []
              : [
                  {
                    id: 'req-body',
                    target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_BODY}`,
                    mode: 'fill' as const,
                    content: 'Lengkapi body matching request sesuai tipe yang dipilih.',
                    optional: true,
                  },
                ]),
            {
              id: 'req-status',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_STATUS}`,
              mode: 'fill',
              content: 'Aktifkan skenario request ini sebelum disimpan.',
            },
            {
              id: 'req-submit',
              target: `#${API_DETAIL_SEMANTIC_ID.REQ_FORM_FOOTER}`,
              mode: 'hold',
              content: 'Kalau skenario request sudah benar, klik Create. Setelah tersimpan, saya lanjut otomatis.',
            }
          );
        } else if (reqScenarioCreatedDuringTour) {
          nextSteps.push({
            id: 'req-item',
            target: '[data-tour="req-scenario-item"]',
            mode: 'click',
            content: 'Request scenario berhasil dibuat. Klik item ini untuk melihat detailnya di panel utama.',
          });
        } else {
          nextSteps.push({
            id: 'req-add',
            target: `#${API_DETAIL_SEMANTIC_ID.SCENARIO_SIDEBAR_ADD_BTN}`,
            mode: 'click',
            content: 'Klik tombol ini untuk menambahkan request scenario pertama.',
          });
        }
      } else if (progress.createResponseScenario === 'not-started') {
        if (activeModal === 'respScenario') {
          nextSteps.push(
            {
              id: 'resp-name',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_INPUT_NAME}`,
              mode: 'fill',
              content: 'Isi nama response scenario terlebih dahulu.',
            },
            {
              id: 'resp-status-code',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_STATUS_CODE}`,
              mode: 'fill',
              content: 'Masukkan HTTP status code yang akan dikembalikan, misalnya 200.',
            },
            {
              id: 'resp-priority',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_PRIORITY}`,
              mode: 'fill',
              content: 'Atur prioritas response jika ada beberapa response scenario.',
              optional: true,
            },
            {
              id: 'resp-weight',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_WEIGHT}`,
              mode: 'fill',
              content: 'Atur bobot response ini untuk distribusi pemilihan response.',
              optional: true,
            },
            {
              id: 'resp-type-json',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_TYPE_JSON}`,
              mode: 'fill',
              content: 'Pilih JSON Payload, atau ubah ke File Response kalau response yang kamu kirim berupa file.',
            },
            ...(responseTypeMode === 'FILE'
              ? [
                  {
                    id: 'resp-file',
                    target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_FILE_UPLOAD}`,
                    mode: 'fill' as const,
                    content: 'Upload file response yang akan dikembalikan oleh mock API.',
                  },
                ]
              : [
                  {
                    id: 'resp-body',
                    target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_BODY}`,
                    mode: 'fill' as const,
                    content: 'Isi body response mock dengan payload yang ingin dikembalikan.',
                  },
                ]),
            {
              id: 'resp-status',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_STATUS}`,
              mode: 'fill',
              content: 'Pastikan response aktif sebelum disimpan.',
            },
            {
              id: 'resp-submit',
              target: `#${API_DETAIL_SEMANTIC_ID.RESP_FORM_FOOTER}`,
              mode: 'hold',
              content: 'Kalau response sudah benar, klik Create. Setelah tersimpan, onboarding selesai.',
            }
          );
        } else {
          nextSteps.push({
            id: 'resp-add',
            target: `#${API_DETAIL_SEMANTIC_ID.RESPONSES_ADD_BTN}`,
            mode: 'click',
            content: 'Langkah terakhir: klik tombol ini untuk menambahkan response scenario.',
          });
        }
      }
    }

    return nextSteps;
  }, [
    activeModal,
    apiCreatedDuringTour,
    completeStep,
    pathname,
    progress,
    projectCreatedDuringTour,
    reqScenarioCreatedDuringTour,
    requestBodyType,
    responseTypeMode,
    tourActive,
    isInitialized,
  ]);

  useEffect(() => {
    const currentStepId = stepsRef.current[stepIndex]?.id;
    setSteps(builtSteps);
    stepsRef.current = builtSteps;

    if (!currentStepId) {
      setStepIndex(0);
      return;
    }

    const nextIndex = builtSteps.findIndex((step) => step.id === currentStepId);
    setStepIndex(nextIndex >= 0 ? nextIndex : 0);
  }, [builtSteps, stepIndex]);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (!currentStep || !tourActive || !isInitialized) {
      setLayout(null);
      return;
    }

    const update = () => {
      const element = document.querySelector<HTMLElement>(currentStep.target);
      if (!element) {
        setLayout(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const tooltipWidth = tooltipWidthFor(viewport.width || window.innerWidth);
      const centerX = rect.left + rect.width / 2;
      const placement = rect.top > viewport.height * 0.55 ? 'top' : 'bottom';
      const estimatedY =
        placement === 'bottom' ? rect.bottom + 18 : rect.top - tooltipHeightEstimate - 18;
      const top = clamp(
        estimatedY,
        16,
        Math.max(16, (viewport.height || window.innerHeight) - tooltipHeightEstimate - 16)
      );
      const left = clamp(
        centerX - tooltipWidth / 2,
        16,
        Math.max(16, (viewport.width || window.innerWidth) - tooltipWidth - 16)
      );

      setLayout({
        rect,
        tooltipTop: top,
        tooltipLeft: left,
        tooltipWidth,
        tooltipPlacement: placement,
      });
    };

    update();
    const interval = window.setInterval(update, 120);
    const onResize = () => update();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [currentStep, isInitialized, tourActive, viewport.height, viewport.width]);

  useEffect(() => {
    if (!currentStep || !layout) return;
    const el = document.querySelector<HTMLElement>(currentStep.target);
    if (!el) return;

    if (currentStep.mode === 'fill' || currentStep.mode === 'hold') {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.focus({ preventScroll: true });
      }
    }

    const inView =
      layout.rect.top >= 64 && layout.rect.bottom <= (viewport.height || window.innerHeight) - 64;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [currentStep, layout, viewport.height]);

  useEffect(() => {
    const targetElement = currentStep ? document.querySelector<HTMLElement>(currentStep.target) : null;

    if (!targetElement) {
      if (elevatedTargetRef.current) {
        const previous = elevatedTargetRef.current;
        previous.element.style.position = previous.position;
        previous.element.style.zIndex = previous.zIndex;
        previous.element.style.pointerEvents = previous.pointerEvents;
        previous.element.style.isolation = previous.isolation;
        elevatedTargetRef.current = null;
      }
      return;
    }

    if (elevatedTargetRef.current?.element === targetElement) return;

    if (elevatedTargetRef.current) {
      const previous = elevatedTargetRef.current;
      previous.element.style.position = previous.position;
      previous.element.style.zIndex = previous.zIndex;
      previous.element.style.pointerEvents = previous.pointerEvents;
      previous.element.style.isolation = previous.isolation;
    }

    elevatedTargetRef.current = {
      element: targetElement,
      position: targetElement.style.position,
      zIndex: targetElement.style.zIndex,
      pointerEvents: targetElement.style.pointerEvents,
      isolation: targetElement.style.isolation,
    };

    targetElement.style.position = 'relative';
    targetElement.style.zIndex = '10002';
    targetElement.style.pointerEvents = 'auto';
    targetElement.style.isolation = 'isolate';

    return () => {
      if (!elevatedTargetRef.current || elevatedTargetRef.current.element !== targetElement) return;
      targetElement.style.position = elevatedTargetRef.current.position;
      targetElement.style.zIndex = elevatedTargetRef.current.zIndex;
      targetElement.style.pointerEvents = elevatedTargetRef.current.pointerEvents;
      targetElement.style.isolation = elevatedTargetRef.current.isolation;
      elevatedTargetRef.current = null;
    };
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep || currentStep.mode !== 'click') return;

    const targetElement = document.querySelector<HTMLElement>(currentStep.target);
    if (!targetElement) return;

    const onPointerDown = (event: PointerEvent) => {
      const eventTarget = event.target as Node | null;
      const composedPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const clickedInsideTarget =
        composedPath.includes(targetElement) || (eventTarget ? targetElement.contains(eventTarget) : false);
      const clickedTooltip = tooltipRef.current?.contains(eventTarget ?? null);

      if (!clickedInsideTarget || clickedTooltip) return;

      setCompletedStepIds((current) => (current.includes(currentStep.id) ? current : [...current, currentStep.id]));
      window.setTimeout(() => {
        setStepIndex((index) => Math.min(index + 1, Math.max(steps.length - 1, 0)));
      }, 40);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [currentStep, steps.length]);

  useEffect(() => {
    if (!currentStep || currentStep.mode !== 'hold') return;

    const progressKey = HOLD_STEP_TO_PROGRESS_KEY[currentStep.id];
    if (!progressKey || progress[progressKey] !== 'completed') return;

    setCompletedStepIds((current) => (current.includes(currentStep.id) ? current : [...current, currentStep.id]));
    setStepIndex((index) => Math.min(index + 1, Math.max(stepsRef.current.length - 1, 0)));
  }, [currentStep, progress]);

  const blockOverlayClick = () => {
    addToast({
      type: 'info',
      title: 'Ikuti langkah yang disorot',
      description: 'Klik elemen yang disorot atau isi field yang diminta untuk lanjut.',
    });
  };

  const handleBack = () => setStepIndex((current) => Math.max(0, current - 1));

  const handleNext = () => {
    const check = canAdvance(currentStep);
    if (!check.allowed) {
      addToast({
        type: 'info',
        title: 'Lengkapi field dulu',
        description: check.reason || 'Isi field yang sedang disorot sebelum melanjutkan.',
      });
      return;
    }

    if (currentStep) {
      setCompletedStepIds((current) => (current.includes(currentStep.id) ? current : [...current, currentStep.id]));
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const handlePass = () => {
    if (currentStep) {
      setCompletedStepIds((current) => (current.includes(currentStep.id) ? current : [...current, currentStep.id]));
    }
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  if (
    !isInitialized ||
    !isCoachMarkHydrated ||
    !tourActive ||
    steps.length === 0 ||
    !currentStep ||
    !layout ||
    viewport.width === 0 ||
    viewport.height === 0
  ) {
    return null;
  }

  const rect = layout.rect;
  const arrowLeft = clamp(rect.left + rect.width / 2 - layout.tooltipLeft, 24, layout.tooltipWidth - 24);
  const arrowAbsoluteX = layout.tooltipLeft + arrowLeft;

  const tourRoot = typeof document !== 'undefined' ? document.body : null;

  if (!tourRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 pointer-events-none">
      <BackdropSlice
        onBlock={blockOverlayClick}
        top={0}
        left={0}
        right={0}
        height={Math.max(0, rect.top)}
      />
      <BackdropSlice
        onBlock={blockOverlayClick}
        top={Math.max(0, rect.top)}
        left={0}
        width={Math.max(0, rect.left)}
        height={Math.max(0, rect.height)}
      />
      <BackdropSlice
        onBlock={blockOverlayClick}
        top={Math.max(0, rect.top)}
        left={Math.max(0, rect.right)}
        right={0}
        height={Math.max(0, rect.height)}
      />
      <BackdropSlice
        onBlock={blockOverlayClick}
        top={Math.max(0, rect.bottom)}
        left={0}
        right={0}
        bottom={0}
      />

      <SpotlightFrame rect={rect} />

      <div
        aria-hidden="true"
        className="fixed z-9998 bg-linear-to-b from-indigo-300/0 via-indigo-300/80 to-indigo-300/0 pointer-events-none"
        style={{
          left: arrowAbsoluteX - 1.5,
          top:
            layout.tooltipPlacement === 'bottom'
              ? rect.bottom + 8
              : layout.tooltipTop + tooltipHeightEstimate + 8,
          width: 3,
          height:
            layout.tooltipPlacement === 'bottom'
              ? Math.max(0, layout.tooltipTop - rect.bottom - 16)
              : Math.max(0, rect.top - (layout.tooltipTop + tooltipHeightEstimate) - 16),
          pointerEvents: 'none',
          transition: 'left 0.5s cubic-bezier(0.16, 1, 0.3, 1), top 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      <div
        className="fixed z-10001 pointer-events-auto"
        style={{
          top: layout.tooltipTop,
          left: layout.tooltipLeft,
          width: layout.tooltipWidth,
          transition: 'top 0.5s cubic-bezier(0.16, 1, 0.3, 1), left 0.5s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        ref={tooltipRef}
      >
        <RigidTooltip
          step={currentStep}
          index={stepIndex}
          total={steps.length}
          completedStepIds={completedStepIds}
          canAdvance={canAdvance(currentStep)}
          onBack={handleBack}
          onNext={handleNext}
          onPass={handlePass}
          onSkip={disableTour}
        />
        <div
          aria-hidden="true"
          className={`absolute border-l-8 border-r-8 border-transparent ${
            layout.tooltipPlacement === 'bottom'
              ? '-top-2 border-b-8 border-b-slate-950'
              : '-bottom-2 border-t-8 border-t-slate-950'
          }`}
          style={{
            left: arrowLeft,
            transform: 'translateX(-50%)',
            transition: 'left 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </div>,
    tourRoot
  );
};

export default OnboardingTour;
