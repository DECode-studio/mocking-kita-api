'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Play,
  Loader2,
  GitFork,
  Move,
} from 'lucide-react';
import {
  ScenarioFlow,
  ScenarioFlowStep,
  ScenarioFlowExecution,
} from '@/src/client/domain/scenario-flow/entity/scenario_flow';
import { CanvasStepNode } from './CanvasStepNode';

interface ScenarioFlowCanvasProps {
  flow: ScenarioFlow;
  stepPositions: Record<string, { x: number; y: number }>;
  selectedStepIndex: number;
  latestExecution: ScenarioFlowExecution | null;
  isRunning: boolean;
  isInspectorOpen: boolean;
  onPositionChange: (stepId: string, x: number, y: number) => void;
  onSelectStep: (index: number) => void;
  onToggleInspector: () => void;
  onAutoArrange: () => void;
  onOpenAddStep: () => void;
  onEditStep: (step: ScenarioFlowStep) => void;
  onDeleteStep: (stepId: string, stepName: string) => void;
  onToggleStepEnabled: (step: ScenarioFlowStep) => void;
}

const NODE_WIDTH = 380;
const NODE_PORT_Y_OFFSET = 95; // Approximate center of port

export const ScenarioFlowCanvas: React.FC<ScenarioFlowCanvasProps> = ({
  flow,
  stepPositions,
  selectedStepIndex,
  latestExecution,
  isRunning,
  isInspectorOpen,
  onPositionChange,
  onSelectStep,
  onToggleInspector,
  onAutoArrange,
  onOpenAddStep,
  onEditStep,
  onDeleteStep,
  onToggleStepEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number } | null>(null);

  const steps = flow.steps || [];

  // Pan Canvas handlers
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on canvas background
    if (e.target !== containerRef.current && (e.target as HTMLElement).id !== 'canvas-surface') {
      return;
    }
    if (e.button !== 0 && e.button !== 1) return; // Left or Middle click

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    setIsPanning(true);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.clientX;
    const dy = e.clientY - panStartRef.current.clientY;
    setPan({
      x: panStartRef.current.startPanX + dx,
      y: panStartRef.current.startPanY + dy,
    });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    setIsPanning(false);
    panStartRef.current = null;
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.0);

    // Zoom centered towards mouse cursor
    const scaleDiff = newZoom / zoom;
    const newPanX = cursorX - (cursorX - pan.x) * scaleDiff;
    const newPanY = cursorY - (cursorY - pan.y) * scaleDiff;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.15, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev * 0.85, 0.35));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  // Center view on selected step if needed
  const centerOnStep = (index: number) => {
    const step = steps[index];
    if (!step) return;
    const pos = stepPositions[step.id];
    if (!pos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: rect.width / 2 - (pos.x + NODE_WIDTH / 2) * zoom,
      y: rect.height / 2 - (pos.y + NODE_PORT_Y_OFFSET) * zoom,
    });
  };

  // Compute SVG Bézier curves connecting Step i -> Step i+1
  const renderConnections = () => {
    if (steps.length < 2) return null;

    const curves: React.ReactNode[] = [];

    for (let i = 0; i < steps.length - 1; i++) {
      const stepA = steps[i];
      const stepB = steps[i + 1];

      const posA = stepPositions[stepA.id] || { x: 80 + i * 440, y: 120 };
      const posB = stepPositions[stepB.id] || { x: 80 + (i + 1) * 440, y: 120 };

      // Output port of A (right side)
      const x1 = posA.x + NODE_WIDTH;
      const y1 = posA.y + NODE_PORT_Y_OFFSET;

      // Input port of B (left side)
      const x2 = posB.x;
      const y2 = posB.y + NODE_PORT_Y_OFFSET;

      // Cubic Bézier control points
      const dx = Math.max(90, Math.abs(x2 - x1) * 0.45);
      const cx1 = x1 + dx;
      const cy1 = y1;
      const cx2 = x2 - dx;
      const cy2 = y2;

      const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

      // Execution status of stepA
      const execStepA = latestExecution?.steps?.[i];
      const isStepRunning = isRunning;
      const isSuccess = !isRunning && execStepA?.status === 'SUCCESS';
      const isFailed = !isRunning && execStepA?.status === 'FAILED';

      let strokeColor = '#64748b'; // default slate-500
      let strokeWidth = 2.5;
      let strokeDash = 'none';

      if (isStepRunning) {
        strokeColor = '#a855f7'; // purple-500
        strokeWidth = 3;
        strokeDash = '8 6';
      } else if (isSuccess) {
        strokeColor = '#10b981'; // emerald-500
        strokeWidth = 3;
      } else if (isFailed) {
        strokeColor = '#f43f5e'; // rose-500
        strokeWidth = 3;
      }

      curves.push(
        <g key={`conn-${stepA.id}-${stepB.id}`}>
          {/* Subtle glow layer behind the connection */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth + 4}
            strokeOpacity={isStepRunning ? 0.35 : 0.15}
            strokeLinecap="round"
          />

          {/* Main Bézier path */}
          <path
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
            strokeLinecap="round"
          >
            {isStepRunning && (
              <animate
                attributeName="stroke-dashoffset"
                from="28"
                to="0"
                dur="0.8s"
                repeatCount="indefinite"
              />
            )}
          </path>

          {/* Flow Direction Indicator or Traveling Particle */}
          {isStepRunning ? (
            <circle r="4.5" fill="#d8b4fe">
              <animateMotion path={pathData} dur="1.2s" repeatCount="indefinite" />
            </circle>
          ) : (
            <circle
              cx={(x1 + x2) / 2}
              cy={(y1 + y2) / 2}
              r="4"
              fill={strokeColor}
              className="shadow-sm"
            />
          )}
        </g>
      );
    }

    return curves;
  };

  return (
    <div
      ref={containerRef}
      id="canvas-surface"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onWheel={handleWheel}
      className={`relative w-full h-185 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 select-none bg-slate-950 ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.18) 1.5px, transparent 1.5px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Canvas Viewport Transform Matrix */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        }}
      >
        {/* SVG Connections Layer */}
        <svg
          className="absolute overflow-visible top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          {renderConnections()}
        </svg>

        {/* Nodes Layer */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-auto">
          {steps.map((step, idx) => {
            const pos = stepPositions[step.id] || { x: 80 + idx * 440, y: 120 };
            const execStep = latestExecution?.steps?.[idx] || null;

            return (
              <CanvasStepNode
                key={step.id}
                step={step}
                index={idx}
                totalSteps={steps.length}
                position={pos}
                isSelected={selectedStepIndex === idx}
                executionStep={execStep}
                isRunning={isRunning}
                zoom={zoom}
                onPositionChange={onPositionChange}
                onSelect={() => {
                  onSelectStep(idx);
                }}
                onDoubleClick={() => {
                  onSelectStep(idx);
                  if (!isInspectorOpen) {
                    onToggleInspector();
                  }
                }}
                onEdit={onEditStep}
                onDelete={onDeleteStep}
                onToggleEnabled={onToggleStepEnabled}
              />
            );
          })}
        </div>
      </div>

      {/* Empty State if No Steps */}
      {steps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-8 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl pointer-events-auto space-y-3 max-w-sm">
            <GitFork className="w-10 h-10 mx-auto text-purple-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Flow Diagram is Empty
            </h3>
            <p className="text-xs text-slate-500">
              Start building your chained API flow by adding your first step.
            </p>
            <button
              onClick={onOpenAddStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Step
            </button>
          </div>
        </div>
      )}

      {/* Top Controls Overlay Island */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-lg">
        <button
          onClick={onAutoArrange}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors cursor-pointer"
          title="Auto-Arrange Layout (Align Left-to-Right)"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>Auto-Arrange</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

        <button
          onClick={onOpenAddStep}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Add New Step"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Add Step</span>
        </button>
      </div>

      {/* Floating Inspector Toggle Button */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={onToggleInspector}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
            isInspectorOpen
              ? 'bg-purple-600 text-white shadow-purple-500/20'
              : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50'
          }`}
        >
          {isInspectorOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
          <span>{isInspectorOpen ? 'Hide Inspector' : 'Live Inspector'}</span>
          {latestExecution && (
            <span
              className={`w-2 h-2 rounded-full ${
                latestExecution.status === 'SUCCESS'
                  ? 'bg-emerald-400'
                  : latestExecution.status === 'FAILED'
                  ? 'bg-rose-400'
                  : 'bg-indigo-400 animate-ping'
              }`}
            />
          )}
        </button>
      </div>

      {/* Bottom Floating Navigation Toolbar */}
      <div className="absolute bottom-4 left-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-lg text-slate-600 dark:text-slate-300">
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono font-bold px-1.5 min-w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

        <button
          onClick={handleResetZoom}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reset View (100%)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Hint Legend */}
      <div className="absolute bottom-4 right-4 z-30 hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 pointer-events-none">
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-purple-400" />
          Drag canvas to pan
        </span>
        <span>•</span>
        <span>Wheel to zoom</span>
        <span>•</span>
        <span>Drag cards to reposition</span>
      </div>
    </div>
  );
};
