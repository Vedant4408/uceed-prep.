'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Grid,
  HelpCircle,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  AttemptResponse,
  ExamPaperConfig,
  PersistedExamSession,
  Question,
  TestAttempt,
} from '@/lib/types';
import {
  evaluateQuestionResponse,
  evaluateTestAttempt,
  getQuestionVerificationStatus,
} from '@/lib/scoring';
import { QuestionDiagram } from './QuestionDiagram';
import { ThemeToggleButton } from './ThemeProvider';

export const ACTIVE_EXAM_STORAGE_KEY = 'uceed_active_session_v1';

interface ExamInterfaceProps {
  exam: ExamPaperConfig;
  questions: Question[];
  mode: 'exam' | 'practice';
  previouslyAttemptedQuestionIds: Set<string>;
  bookmarkedIds: Set<string>;
  restoredSession?: PersistedExamSession | null;
  onToggleBookmark: (questionId: string, note?: string) => void;
  onCompleteAttempt: (attempt: TestAttempt) => void;
  onExit: () => void;
}

export function ExamInterface({
  exam,
  questions,
  mode,
  previouslyAttemptedQuestionIds,
  bookmarkedIds,
  restoredSession,
  onToggleBookmark,
  onCompleteAttempt,
  onExit,
}: ExamInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (
      restoredSession &&
      restoredSession.exam.id === exam.id &&
      restoredSession.currentIndex >= 0 &&
      restoredSession.currentIndex < questions.length
    ) {
      return restoredSession.currentIndex;
    }
    return 0;
  });

  // Deterministic initial state for SSR/hydration safety; set actual timestamp in useEffect
  const [startedAt, setStartedAt] = useState<string>(
    () => restoredSession?.startedAt || '2026-10-24T09:00:00.000Z'
  );
  const deadlineRef = useRef<number | null>(
    restoredSession?.deadlineTimestamp ?? null
  );

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return exam.durationMinutes * 60;
  });

  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => {
    if (restoredSession?.visitedIds?.length) {
      return new Set(restoredSession.visitedIds);
    }
    return new Set(questions[0] ? [questions[0].id] : []);
  });

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [reportModalQuestion, setReportModalQuestion] =
    useState<Question | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmittedMsg, setReportSubmittedMsg] = useState<string | null>(
    null
  );
  const [autosaveStatus, setAutosaveStatus] = useState<string>('Autosaved');

  const [responses, setResponses] = useState<Record<string, AttemptResponse>>(
    () => {
      if (
        restoredSession &&
        restoredSession.exam.id === exam.id &&
        restoredSession.responses
      ) {
        return restoredSession.responses;
      }
      const initial: Record<string, AttemptResponse> = {};
      for (const q of questions) {
        initial[q.id] = {
          questionId: q.id,
          submittedAnswer: null,
          isMarkedForReview: false,
          timeSpentSeconds: 0,
          answerHistory: [],
          isRepeatAttempt: previouslyAttemptedQuestionIds.has(q.id),
        };
      }
      return initial;
    }
  );

  const currentQuestion = questions[currentIndex];
  const currentResponse = currentQuestion
    ? responses[currentQuestion.id]
    : undefined;

  // Initialize deadline on client mount (hydration-safe) and sync remaining time
  useEffect(() => {
    const now = Date.now();
    if (!deadlineRef.current) {
      deadlineRef.current = now + exam.durationMinutes * 60 * 1000;
      setStartedAt(new Date(now).toISOString());
    } else {
      const rem = Math.max(0, Math.round((deadlineRef.current - now) / 1000));
      setRemainingSeconds(rem);
    }
  }, [exam.durationMinutes]);

  // Tick overall countdown & per-question timer every second using deadlineTimestamp
  useEffect(() => {
    if (showSubmitModal) return;
    const interval = setInterval(() => {
      if (deadlineRef.current) {
        const rem = Math.max(
          0,
          Math.round((deadlineRef.current - Date.now()) / 1000)
        );
        setRemainingSeconds(rem);
      } else {
        setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
      }

      if (currentQuestion) {
        setResponses((prev) => {
          const cur = prev[currentQuestion.id];
          if (!cur) return prev;
          return {
            ...prev,
            [currentQuestion.id]: {
              ...cur,
              timeSpentSeconds: cur.timeSpentSeconds + 1,
            },
          };
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion, showSubmitModal]);

  // Persist active exam session (including deadlineTimestamp & responses) to localStorage
  useEffect(() => {
    if (!deadlineRef.current) return;
    try {
      const sessionPayload: PersistedExamSession = {
        exam,
        questionIds: questions.map((q) => q.id),
        mode,
        startedAt,
        deadlineTimestamp: deadlineRef.current,
        currentIndex,
        visitedIds: Array.from(visitedIds),
        responses,
      };
      localStorage.setItem(
        ACTIVE_EXAM_STORAGE_KEY,
        JSON.stringify(sessionPayload)
      );
      localStorage.setItem(
        `uceed_autosave_${exam.id}`,
        JSON.stringify({
          examId: exam.id,
          updatedAt: Date.now(),
          responses,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [responses, currentIndex, visitedIds, exam, questions, mode, startedAt]);

  const goToQuestion = (idx: number) => {
    const target = questions[idx];
    if (!target) return;
    setCurrentIndex(idx);
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(target.id);
      return next;
    });
    setShowMobilePalette(false);
  };

  // Keyboard navigation (Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        goToQuestion(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        goToQuestion(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const updateAnswer = (value: string | string[] | null) => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      const nextHistory = [...(existing?.answerHistory || [])];
      if (
        value !== null &&
        ((typeof value === 'string' && value.trim() !== '') ||
          (Array.isArray(value) && value.length > 0))
      ) {
        nextHistory.push({ timestamp: Date.now(), value });
      }
      return {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          submittedAnswer: value,
          answerHistory: nextHistory,
        },
      };
    });
  };

  const toggleMsqOption = (optionId: string) => {
    if (!currentQuestion || !currentResponse) return;
    const currentArr = Array.isArray(currentResponse.submittedAnswer)
      ? [...currentResponse.submittedAnswer]
      : [];
    const exists = currentArr.includes(optionId);
    const updated = exists
      ? currentArr.filter((id) => id !== optionId)
      : [...currentArr, optionId].sort();
    updateAnswer(updated.length > 0 ? updated : null);
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setResponses((prev) => {
      const existing = prev[currentQuestion.id];
      return {
        ...prev,
        [currentQuestion.id]: {
          ...existing,
          isMarkedForReview: !existing.isMarkedForReview,
        },
      };
    });
  };

  const clearResponse = () => {
    updateAnswer(null);
  };

  const handleExitSession = () => {
    try {
      localStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY);
    } catch {
      // Ignore
    }
    onExit();
  };

  const finalizeAndSubmit = () => {
    const responseList = Object.values(responses);
    const attempt = evaluateTestAttempt({
      id: `attempt-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      examYear: exam.year,
      mode,
      startedAt,
      completedAt: new Date().toISOString(),
      questions,
      responses: responseList,
      isDemoData: false,
    });
    try {
      localStorage.removeItem(`uceed_autosave_${exam.id}`);
      localStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY);
    } catch {
      // Ignore
    }
    onCompleteAttempt(attempt);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (!currentQuestion || !currentResponse) return null;

  const isAnswered = (r?: AttemptResponse) =>
    Boolean(
      r &&
        r.submittedAnswer !== null &&
        ((typeof r.submittedAnswer === 'string' &&
          r.submittedAnswer.trim() !== '') ||
          (Array.isArray(r.submittedAnswer) && r.submittedAnswer.length > 0))
    );

  const totalAnsweredCount = questions.filter((q) =>
    isAnswered(responses[q.id])
  ).length;
  const totalMarkedCount = questions.filter(
    (q) => responses[q.id]?.isMarkedForReview
  ).length;
  const totalUnansweredCount = questions.length - totalAnsweredCount;

  const isCurrentRevealed = revealedIds.has(currentQuestion.id);
  const instantEval =
    mode === 'practice' && isCurrentRevealed
      ? evaluateQuestionResponse(currentQuestion, currentResponse)
      : null;

  const verificationBadge = getQuestionVerificationStatus(currentQuestion);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col pb-24 lg:pb-6">
      {/* Compact Mobile & Desktop Exam Header Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 bg-white px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleExitSession}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit Session</span>
            <span className="sm:hidden">Exit</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xs sm:text-sm font-semibold text-slate-900">
              {exam.title}
            </h1>
            <p className="truncate text-[11px] text-slate-500">
              <span className="font-mono font-semibold text-slate-700">
                Q {currentIndex + 1}/{questions.length}
              </span>{' '}
              · {mode === 'exam' ? 'Exam Mode' : 'Practice Mode'} ·{' '}
              <span className="hidden sm:inline">{autosaveStatus}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <ThemeToggleButton testId="exam-theme-toggle" />
          {/* Live Countdown Timer */}
          <div
            data-testid="exam-countdown-timer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 sm:px-3.5 py-1.5"
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-700 shrink-0" />
            <div className="text-xs">
              <span className="hidden md:inline text-slate-500 mr-1.5">
                Time Left:
              </span>
              <span
                className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                  remainingSeconds < 180 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {formatTimer(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Mobile Question Palette Trigger Button */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(true)}
            aria-label="Open question palette"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            <Grid className="h-3.5 w-3.5 text-sky-700" />
            <span className="font-mono tabular-nums">
              {totalAnsweredCount}/{questions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit Test</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Split Exam Layout */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-6">
        {/* Left: Active Question Stage */}
        <div className="flex-1 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div>
            {/* Question Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-600">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{currentQuestion.code}</span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.section}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline">
                  {currentQuestion.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.difficulty}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-slate-700 font-medium tabular-nums">
                  +{currentQuestion.markingRule.maxMarks} / -
                  {currentQuestion.markingRule.negativeMarks}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  |
                </span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {formatTimer(currentResponse.timeSpentSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleBookmark(currentQuestion.id)}
                  aria-label={
                    bookmarkedIds.has(currentQuestion.id)
                      ? 'Remove Bookmark'
                      : 'Bookmark Question'
                  }
                  className={`inline-flex min-h-[36px] items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    bookmarkedIds.has(currentQuestion.id)
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {bookmarkedIds.has(currentQuestion.id)
                      ? 'Bookmarked'
                      : 'Bookmark'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportModalQuestion(currentQuestion);
                    setReportSubmittedMsg(null);
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            </div>

            {/* Source & Verification Classification Notice */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                {verificationBadge}
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentQuestion.markingRule.description}</span>
            </div>

            {/* Question Statement */}
            <div className="mt-4 text-sm sm:text-base leading-relaxed text-slate-900">
              {currentQuestion.statement}
            </div>

            {/* Technical Diagram with Zoom Controls */}
            <QuestionDiagram
              diagramType={currentQuestion.diagramType}
              imageUrl={currentQuestion.imageUrl}
            />

            {/* Input Controls by Question Type */}
            <div className="mt-5 sm:mt-6">
              {currentQuestion.questionType === 'NAT' && (
                <div className="max-w-md space-y-3.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4">
                  <label
                    htmlFor="nat-answer-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Numerical Answer Type (NAT) — Enter exact numerical value:
                  </label>
                  <input
                    id="nat-answer-input"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={
                      typeof currentResponse.submittedAnswer === 'string'
                        ? currentResponse.submittedAnswer
                        : ''
                    }
                    onChange={(e) => updateAnswer(e.target.value)}
                    placeholder="e.g. 14"
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-base text-slate-900 focus:border-sky-600 focus:outline-none tabular-nums"
                  />
                  {/* Touch-Friendly Virtual Numeric Keypad (>=44px height) */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {[
                      '1',
                      '2',
                      '3',
                      '4',
                      '5',
                      '6',
                      '7',
                      '8',
                      '9',
                      '0',
                      '.',
                      '-',
                    ].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => {
                          const cur =
                            typeof currentResponse.submittedAnswer === 'string'
                              ? currentResponse.submittedAnswer
                              : '';
                          updateAnswer(cur + digit);
                        }}
                        className="min-h-[44px] rounded-lg border border-slate-200 bg-white py-2 font-mono text-sm font-semibold text-slate-800 hover:bg-slate-100 active:bg-slate-200"
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.questionType === 'MCQ' &&
                currentQuestion.options && (
                  <div
                    className="space-y-2.5"
                    role="radiogroup"
                    aria-label="Multiple choice options"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      Select the single correct option (+
                      {currentQuestion.markingRule.maxMarks} marks, -
                      {currentQuestion.markingRule.negativeMarks} negative marks):
                    </p>
                    {currentQuestion.options.map((opt) => {
                      const selected =
                        currentResponse.submittedAnswer === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateAnswer(opt.id)}
                          className={`flex min-h-[48px] w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                            selected
                              ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold ${
                              selected
                                ? 'border-sky-700 bg-sky-700 text-white'
                                : 'border-slate-300 bg-slate-50 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-sm leading-relaxed">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {currentQuestion.questionType === 'MSQ' &&
                currentQuestion.options && (
                  <div
                    className="space-y-2.5"
                    role="group"
                    aria-label="Multiple select options"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      Multiple Select Question (MSQ) — Select ONE or MORE correct
                      options (+4 all correct, +3/+2/+1 partial if zero wrong
                      chosen, -1 if any wrong chosen):
                    </p>
                    {currentQuestion.options.map((opt) => {
                      const selectedArr = Array.isArray(
                        currentResponse.submittedAnswer
                      )
                        ? currentResponse.submittedAnswer
                        : [];
                      const selected = selectedArr.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleMsqOption(opt.id)}
                          className={`flex min-h-[48px] w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                            selected
                              ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-xs font-semibold ${
                              selected
                                ? 'border-sky-700 bg-sky-700 text-white'
                                : 'border-slate-300 bg-slate-50 text-slate-700'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span className="text-sm leading-relaxed">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {currentQuestion.questionType === 'DRAWING' && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label
                    htmlFor="partb-exam-notes"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Part B Drawing Response Summary / Self-Evaluation Notes (Full
                    canvas, camera capture & upload available in Part B Studio):
                  </label>
                  <textarea
                    id="partb-exam-notes"
                    rows={4}
                    value={
                      typeof currentResponse.submittedAnswer === 'string'
                        ? currentResponse.submittedAnswer
                        : ''
                    }
                    onChange={(e) => updateAnswer(e.target.value)}
                    placeholder="Describe your composition, horizon line placement, and key callouts completed on your drawing sheet (or mark 'Completed on A4 sheet')..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Practice Mode Instant Answer Reveal Box */}
            {mode === 'practice' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setRevealedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(currentQuestion.id)) {
                        next.delete(currentQuestion.id);
                      } else {
                        next.add(currentQuestion.id);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  {isCurrentRevealed
                    ? 'Hide Verified Solution'
                    : 'Reveal Answer & 8-Point Explanation'}
                </button>

                {isCurrentRevealed && instantEval && (
                  <div className="mt-3 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <span className="font-semibold text-slate-900">
                        Verified Answer:{' '}
                        <span className="font-mono text-sky-800">
                          {Array.isArray(currentQuestion.correctAnswer)
                            ? currentQuestion.correctAnswer.join(', ')
                            : currentQuestion.correctAnswer}
                        </span>
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        Status: {instantEval.status.toUpperCase()} (
                        {instantEval.marksAwarded >= 0 ? '+' : ''}
                        {instantEval.marksAwarded} / {instantEval.maxMarks} Marks)
                      </span>
                    </div>
                    <p>
                      <strong className="text-slate-900">
                        Diagnostic Feedback:
                      </strong>{' '}
                      {instantEval.whyAnswerWasWrong}
                    </p>
                    <p>
                      <strong className="text-slate-900">Reasoning:</strong>{' '}
                      {currentQuestion.explanation}
                    </p>
                    <p>
                      <strong className="text-slate-900">Concept Tested:</strong>{' '}
                      {currentQuestion.conceptTested}
                    </p>
                    <p>
                      <strong className="text-slate-900">
                        Practical Method:
                      </strong>{' '}
                      {currentQuestion.practicalMethod}
                    </p>
                    <p>
                      <strong className="text-slate-900">Takeaway:</strong>{' '}
                      {currentQuestion.shortTakeaway}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Mobile & Desktop Bottom Action Controls (>=44px Touch Targets) */}
          <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-2.5 lg:static lg:mt-8 lg:border-t lg:bg-transparent lg:px-0 lg:pt-4 lg:pb-0">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  onClick={toggleMarkForReview}
                  className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 sm:px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    currentResponse.isMarkedForReview
                      ? 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {currentResponse.isMarkedForReview
                      ? 'Marked for Review'
                      : 'Mark for Review'}
                  </span>
                  <span className="sm:hidden">
                    {currentResponse.isMarkedForReview ? 'Marked' : 'Review'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={clearResponse}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Response</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => goToQuestion(currentIndex - 1)}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToQuestion(currentIndex + 1)}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-slate-900 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
                  >
                    <span>Review & Submit</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Desktop Question Palette & Legend */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Question Palette
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Click any question number to jump directly.
            </p>

            {/* Status Summary Counts */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="font-mono text-base font-bold text-emerald-700 tabular-nums">
                  {totalAnsweredCount}
                </div>
                <div className="text-slate-600">Answered</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="font-mono text-base font-bold text-slate-700 tabular-nums">
                  {totalUnansweredCount}
                </div>
                <div className="text-slate-600">Unanswered</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="font-mono text-base font-bold text-amber-700 tabular-nums">
                  {totalMarkedCount}
                </div>
                <div className="text-slate-600">Marked for Review</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="font-mono text-base font-bold text-slate-500 tabular-nums">
                  {questions.length - visitedIds.size}
                </div>
                <div className="text-slate-600">Not Visited</div>
              </div>
            </div>

            {/* Number Grid */}
            <div className="mt-5 grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const resp = responses[q.id];
                const answered = isAnswered(resp);
                const marked = resp?.isMarkedForReview;
                const visited = visitedIds.has(q.id);
                const isCurrent = idx === currentIndex;

                let btnStyle =
                  'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100';
                if (answered && marked) {
                  btnStyle =
                    'border-amber-500 bg-emerald-600 text-white font-semibold';
                } else if (marked) {
                  btnStyle =
                    'border-amber-400 bg-amber-100 text-amber-900 font-semibold';
                } else if (answered) {
                  btnStyle =
                    'border-emerald-600 bg-emerald-600 text-white font-semibold';
                } else if (visited) {
                  btnStyle = 'border-red-300 bg-red-50 text-red-800';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    aria-label={`Jump to Question ${idx + 1}`}
                    className={`h-10 rounded-lg border font-mono text-xs transition-all tabular-nums ${btnStyle} ${
                      isCurrent ? 'ring-2 ring-sky-600 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Exam Section Structure Breakdown */}
            <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-800">
                Official {exam.year} Marking Rules
              </div>
              {exam.sections.map((s) => (
                <div key={s.name} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{s.name}:</span> +
                  {s.marksPerQuestion} / -{s.negativeMarks}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Expandable Mobile Question Palette Drawer */}
      {showMobilePalette && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile question palette"
        >
          <div className="max-h-[82vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Question Palette ({totalAnsweredCount}/{questions.length} Answered)
                </h2>
                <p className="text-xs text-slate-500">
                  Tap any question number to jump directly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                aria-label="Close question palette"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="font-mono text-sm font-bold text-emerald-700">
                  {totalAnsweredCount}
                </div>
                <div className="text-slate-600">Answered</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="font-mono text-sm font-bold text-slate-700">
                  {totalUnansweredCount}
                </div>
                <div className="text-slate-600">Left</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="font-mono text-sm font-bold text-amber-700">
                  {totalMarkedCount}
                </div>
                <div className="text-slate-600">Review</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="font-mono text-sm font-bold text-slate-500">
                  {questions.length - visitedIds.size}
                </div>
                <div className="text-slate-600">Unseen</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const resp = responses[q.id];
                const answered = isAnswered(resp);
                const marked = resp?.isMarkedForReview;
                const visited = visitedIds.has(q.id);
                const isCurrent = idx === currentIndex;

                let btnStyle =
                  'border-slate-200 bg-slate-50 text-slate-700';
                if (answered && marked) {
                  btnStyle =
                    'border-amber-500 bg-emerald-600 text-white font-semibold';
                } else if (marked) {
                  btnStyle =
                    'border-amber-400 bg-amber-100 text-amber-900 font-semibold';
                } else if (answered) {
                  btnStyle =
                    'border-emerald-600 bg-emerald-600 text-white font-semibold';
                } else if (visited) {
                  btnStyle = 'border-red-300 bg-red-50 text-red-800';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    className={`min-h-[44px] rounded-lg border font-mono text-xs tabular-nums ${btnStyle} ${
                      isCurrent ? 'ring-2 ring-sky-600 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowMobilePalette(false)}
                className="min-h-[44px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700"
              >
                Continue Solving
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobilePalette(false);
                  setShowSubmitModal(true);
                }}
                className="min-h-[44px] rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="submit-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Confirm Test Submission
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Please review your response summary before generating your
                  official UCEED evaluation report.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                aria-label="Close submit confirmation"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-xs">
              <div>
                <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {totalAnsweredCount}
                </div>
                <div className="text-slate-600">Answered</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-slate-700 tabular-nums">
                  {totalUnansweredCount}
                </div>
                <div className="text-slate-600">Unattempted</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-amber-700 tabular-nums">
                  {totalMarkedCount}
                </div>
                <div className="text-slate-600">Marked Review</div>
              </div>
            </div>

            {totalMarkedCount > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  You have {totalMarkedCount} question(s) marked for review.
                  Answered questions marked for review will be evaluated.
                </span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="min-h-[44px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Return to Questions
              </button>
              <button
                type="button"
                onClick={finalizeAndSubmit}
                className="min-h-[44px] rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
              >
                Submit & Evaluate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Question Modal */}
      {reportModalQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-question-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3
                id="report-question-title"
                className="text-base font-semibold text-slate-900"
              >
                Report Issue · {reportModalQuestion.code}
              </h3>
              <button
                type="button"
                onClick={() => setReportModalQuestion(null)}
                aria-label="Close report modal"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Flag an ambiguity in the diagram, statement, or official answer key
              for moderator verification.
            </p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the discrepancy (e.g., typo in options, diagram alignment)..."
              className="mt-3 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
            />
            {reportSubmittedMsg && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {reportSubmittedMsg}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportModalQuestion(null)}
                className="min-h-[40px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!reportReason.trim()) return;
                  setReportSubmittedMsg(
                    'Report logged for academic review. Thank you!'
                  );
                  setReportReason('');
                }}
                className="min-h-[40px] rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
