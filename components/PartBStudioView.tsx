'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Grid,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { PartBSubmission, Question } from '@/lib/types';
import { QuestionDiagram } from './QuestionDiagram';

interface PartBStudioViewProps {
  partBQuestions: Question[];
  submissions: PartBSubmission[];
  onSaveSubmission: (sub: PartBSubmission) => void;
}

export function PartBStudioView({
  partBQuestions,
  submissions,
  onSaveSubmission,
}: PartBStudioViewProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    partBQuestions[0]?.id || ''
  );
  const selectedQuestion =
    partBQuestions.find((q) => q.id === selectedQuestionId) ||
    partBQuestions[0];

  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [timerRunning, setTimerRunning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<{
    fileName: string;
    compressedKb: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showPerspectiveGrid, setShowPerspectiveGrid] = useState(true);
  const [pencilWeight, setPencilWeight] = useState<'2H' | 'HB' | '4B'>('HB');
  const [selfNotes, setSelfNotes] = useState('');
  const [selfScores, setSelfScores] = useState<Record<string, number>>({});
  const [showReferenceComparison, setShowReferenceComparison] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [activeSubmission, setActiveSubmission] =
    useState<PartBSubmission | null>(submissions[0] || null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(canvas.width, 140);
    ctx.stroke();
  }, [selectedQuestionId]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const applyBrushStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle =
      pencilWeight === '2H'
        ? '#94a3b8'
        : pencilWeight === 'HB'
        ? '#334155'
        : '#0f172a';
    ctx.lineWidth =
      pencilWeight === '2H' ? 1.2 : pencilWeight === 'HB' ? 2.4 : 4.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    applyBrushStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(
      ((e.clientX - rect.left) / rect.width) * canvas.width,
      ((e.clientY - rect.top) / rect.height) * canvas.height
    );
  };

  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyBrushStyle(ctx);
    ctx.lineTo(
      ((e.clientX - rect.left) / rect.width) * canvas.width,
      ((e.clientY - rect.top) / rect.height) * canvas.height
    );
    ctx.stroke();
  };

  const startTouchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!touch || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    applyBrushStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(
      ((touch.clientX - rect.left) / rect.width) * canvas.width,
      ((touch.clientY - rect.top) / rect.height) * canvas.height
    );
  };

  const moveTouchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!touch || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyBrushStyle(ctx);
    ctx.lineTo(
      ((touch.clientX - rect.left) / rect.width) * canvas.width,
      ((touch.clientY - rect.top) / rect.height) * canvas.height
    );
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
    setUploadMeta(null);
    setUploadProgress(null);
  };

  // Compress large mobile camera photos client-side before storing/evaluating
  const compressImageDataUrl = (
    rawDataUrl: string,
    fileName: string
  ): Promise<{ dataUrl: string; compressedKb: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1280;
        let targetW = img.width || 800;
        let targetH = img.height || 600;
        if (targetW > maxDim || targetH > maxDim) {
          if (targetW >= targetH) {
            targetH = Math.round((targetH * maxDim) / targetW);
            targetW = maxDim;
          } else {
            targetW = Math.round((targetW * maxDim) / targetH);
            targetH = maxDim;
          }
        }
        const offscreen = document.createElement('canvas');
        offscreen.width = targetW;
        offscreen.height = targetH;
        const ctx = offscreen.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            compressedKb: Math.round((rawDataUrl.length * 0.75) / 1024),
          });
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = offscreen.toDataURL('image/jpeg', 0.82);
        resolve({
          dataUrl: compressed,
          compressedKb: Math.max(1, Math.round((compressed.length * 0.75) / 1024)),
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          compressedKb: Math.max(1, Math.round((rawDataUrl.length * 0.75) / 1024)),
        });
      };
      img.src = rawDataUrl;
      void fileName;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEvalError('Please upload a valid PNG, JPEG, or WebP drawing image.');
      return;
    }
    setUploadProgress(25);
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.min(75, Math.round((ev.loaded / ev.total) * 75)));
      }
    };
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setUploadProgress(85);
        const { dataUrl, compressedKb } = await compressImageDataUrl(
          reader.result,
          file.name
        );
        setUploadedImage(dataUrl);
        setUploadMeta({ fileName: file.name, compressedKb });
        setUploadProgress(100);
        setEvalError(null);
      }
    };
    reader.onerror = () => {
      setEvalError('Could not read the selected image file. Please try again.');
      setUploadProgress(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEvaluateSubmission = async () => {
    if (!selectedQuestion) return;
    setIsEvaluating(true);
    setEvalError(null);

    try {
      const imageDataUrl =
        uploadedImage ||
        (canvasRef.current ? canvasRef.current.toDataURL('image/png') : '');

      const res = await fetch('/api/ai/evaluate-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionStatement: selectedQuestion.statement,
          evaluationCriteria: selectedQuestion.evaluationCriteria,
          selfAssessmentNotes: selfNotes,
          selfScores,
          imageDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate Part B submission.');
      }

      const newSub: PartBSubmission = {
        id: `partb-${Date.now()}`,
        questionId: selectedQuestion.id,
        questionTitle: `${selectedQuestion.code} · ${selectedQuestion.subtopic}`,
        submittedAt: new Date().toISOString(),
        timeTakenMinutes: Math.max(1, Math.round((1800 - timerSeconds) / 60)),
        imageDataUrl,
        selfAssessmentNotes:
          selfNotes ||
          'Submitted via Part B Studio workspace for rubric critique.',
        selfScores,
        aiEvaluation: data.evaluation,
      };

      onSaveSubmission(newSub);
      setActiveSubmission(newSub);
      setShowReferenceComparison(true);
    } catch (err) {
      setEvalError(
        err instanceof Error
          ? err.message
          : 'Error evaluating drawing. Please retry.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!selectedQuestion) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Studio Header & Prompt Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Part B Drawing & Design Aptitude Studio
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Practice 30-minute perspective scenes and industrial design callouts,
            capture A4 sheets via phone camera or sketch live, and compare against
            official UCEED evaluation rubrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <label htmlFor="partb-prompt-select" className="sr-only">
            Select Part B Prompt
          </label>
          <select
            id="partb-prompt-select"
            value={selectedQuestion.id}
            onChange={(e) => {
              setSelectedQuestionId(e.target.value);
              setTimerSeconds(1800);
              setTimerRunning(false);
            }}
            className="min-h-[42px] w-full sm:w-auto max-w-full truncate rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-600 focus:outline-none"
          >
            {partBQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.code} ({q.year}) — {q.subtopic} ({q.markingRule.maxMarks}M)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
            <Clock className="h-4 w-4 text-sky-700" />
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
              {String(timerSeconds % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="ml-1 min-h-[32px] rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
            >
              {timerRunning ? 'Pause' : 'Start 30m Timer'}
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Statement & Official Evaluation Criteria */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {selectedQuestion.code} · {selectedQuestion.year} ·{' '}
              {selectedQuestion.category}
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              Max Marks: {selectedQuestion.markingRule.maxMarks} · Time Limit: 30
              Mins
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-900">
            {selectedQuestion.statement}
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 sm:p-4 text-xs text-slate-700">
            <div className="font-semibold text-slate-900">
              Mandatory Instructions (UCEED Part B Format):
            </div>
            <ul className="mt-1.5 list-disc pl-4 space-y-1">
              <li>
                Use only graphite pencil linework and tonal shading (2H, HB, 2B,
                4B). Do not use color pencils or ink unless specified.
              </li>
              <li>
                Establish a clear horizon line, human figure proportions, and
                foreground-to-background line-weight contrast.
              </li>
              <li>
                Capture a photo of your physical A4 sketch using your phone camera,
                upload from gallery, OR sketch on the touch board below.
              </li>
            </ul>
          </div>
        </div>

        {/* Official Evaluation Rubric Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Official UCEED Evaluation Criteria
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Examiners allocate the 50 marks across these measurable dimensions:
          </p>
          <div className="mt-4 space-y-3">
            {(selectedQuestion.evaluationCriteria || []).map((c) => (
              <div
                key={c.criterion}
                className="border-b border-slate-100 pb-2.5 last:border-none last:pb-0"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span>{c.criterion}</span>
                  <span className="font-mono text-sky-700 tabular-nums">
                    {c.maxScore}M
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawing Canvas / Mobile Camera & Gallery Upload + Self-Assessment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Interactive Sketchpad & Mobile Camera/Gallery Upload */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Drawing Submission Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Sketch composition thumbnails by touch/mouse or upload a photo of
                your physical A4 drawing sheet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {(['2H', 'HB', '4B'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPencilWeight(w)}
                  className={`inline-flex min-h-[36px] items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${
                    pencilWeight === w
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Pencil className="h-3 w-3" />
                  {w}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowPerspectiveGrid((g) => !g)}
                className={`inline-flex min-h-[36px] items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
                  showPerspectiveGrid
                    ? 'border-sky-600 bg-sky-50 text-sky-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                Grid
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-slate-300 bg-white preserve-light-surface">
            {uploadedImage ? (
              <div className="relative flex flex-col items-center justify-center bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Uploaded student Part B drawing"
                  referrerPolicy="no-referrer"
                  className="max-h-72 w-auto rounded border border-slate-200 object-contain"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 w-full border-t border-slate-200 pt-2.5 text-xs">
                  <div className="text-slate-600 truncate">
                    <span className="font-semibold text-emerald-700">
                      Preview Ready
                    </span>
                    {uploadMeta && (
                      <span className="ml-1.5 font-mono text-slate-500">
                        ({uploadMeta.fileName} · Optimized {uploadMeta.compressedKb}{' '}
                        KB)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadMeta(null);
                        setUploadProgress(null);
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={640}
                height={320}
                data-testid="partb-sketch-canvas"
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startTouchDraw}
                onTouchMove={moveTouchDraw}
                onTouchEnd={stopDraw}
                className="h-64 sm:h-72 w-full cursor-crosshair touch-none"
              />
            )}

            {showPerspectiveGrid && !uploadedImage && (
              <div className="pointer-events-none absolute inset-0 border border-sky-500/20">
                <div className="absolute left-0 right-0 top-[44%] border-t border-dashed border-sky-500/50" />
                <span className="absolute left-3 top-[38%] font-mono text-[10px] text-sky-700">
                  HORIZON GUIDE
                </span>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-600">
                <span>Compressing & preparing drawing image...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-sky-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Mobile Gallery & Camera Upload Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3.5">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">
                Drew on physical A4 paper?
              </strong>{' '}
              Upload from your phone gallery or take a photo with your camera:
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="partb-gallery-input"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="partb-camera-input"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Upload className="h-3.5 w-3.5 text-sky-700" />
                Upload Gallery
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Camera className="h-3.5 w-3.5" />
                Take Photo
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Self-Assessment & Gemini Rubric Critique Trigger */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Student Self-Assessment & Notes
              </h2>
              <p className="text-xs text-slate-500">
                Score your own work against the rubric before requesting AI
                critique or viewing the reference composition.
              </p>
            </div>

            <div className="space-y-3">
              {(selectedQuestion.evaluationCriteria || []).map((c) => {
                const val =
                  selfScores[c.criterion] ?? Math.round(c.maxScore * 0.7);
                return (
                  <div key={c.criterion} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor={`slider-${c.criterion}`}
                        className="font-medium text-slate-700"
                      >
                        {c.criterion}
                      </label>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {val} / {c.maxScore}M
                      </span>
                    </div>
                    <input
                      id={`slider-${c.criterion}`}
                      type="range"
                      min={0}
                      max={c.maxScore}
                      value={val}
                      onChange={(e) =>
                        setSelfScores((prev) => ({
                          ...prev,
                          [c.criterion]: Number(e.target.value),
                        }))
                      }
                      className="h-6 w-full accent-sky-700"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="partb-self-notes"
                className="block text-xs font-medium text-slate-700"
              >
                Self-Critique Notes (Vanishing point, focal hierarchy, things to
                improve):
              </label>
              <textarea
                id="partb-self-notes"
                rows={3}
                value={selfNotes}
                onChange={(e) => setSelfNotes(e.target.value)}
                placeholder="e.g., Placed horizon line at standing eye level; foreground kettle has strong 4B contrast, but background figures need cleaner proportions..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
              />
            </div>

            {evalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {evalError}
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={isEvaluating}
              onClick={handleEvaluateSubmission}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {isEvaluating
                ? 'Evaluating Drawing Rubric with Gemini...'
                : 'Save Submission & Run AI Rubric Critique'}
            </button>

            <button
              type="button"
              onClick={() => setShowReferenceComparison((v) => !v)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              {showReferenceComparison
                ? 'Hide Side-by-Side Reference Comparison'
                : 'Compare Side-by-Side with Reference Solution'}
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Reference Solution & AI Evaluation Feedback */}
      {(showReferenceComparison || activeSubmission?.aiEvaluation) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Reference Composition Guide */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Reference Perspective Structure & Examiner Guidelines
            </h3>
            <QuestionDiagram
              diagramType={selectedQuestion.diagramType}
              mode="reference"
            />
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              {(selectedQuestion.referenceGuidelines || []).map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Rubric Evaluation Result */}
          {activeSubmission?.aiEvaluation && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    AI-Assisted Drawing Evaluation (Diagnostic Estimate)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSubmission.questionTitle}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xl font-bold text-sky-700 tabular-nums">
                    ~{activeSubmission.aiEvaluation.estimatedTotalScore} /{' '}
                    {activeSubmission.aiEvaluation.maxScore}
                  </div>
                  <div className="text-[11px] text-slate-500">Estimated Score</div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <strong>Important Notice:</strong>{' '}
                {activeSubmission.aiEvaluation.disclaimer}
              </div>

              <p className="text-xs leading-relaxed text-slate-700">
                {activeSubmission.aiEvaluation.overallFeedback}
              </p>

              <div className="space-y-2">
                {activeSubmission.aiEvaluation.criteriaBreakdown.map((item) => (
                  <div
                    key={item.criterion}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.criterion}</span>
                      <span className="font-mono text-sky-700 tabular-nums">
                        {item.score} / {item.maxScore}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{item.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
