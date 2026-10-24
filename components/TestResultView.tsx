'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Question, TestAttempt } from '@/lib/types';
import { formatDeterministicDateTime } from '@/lib/scoring';
import { QuestionDiagram } from './QuestionDiagram';
import { ThemeToggleButton } from './ThemeProvider';

interface TestResultViewProps {
  attempt: TestAttempt;
  questions: Question[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (questionId: string) => void;
  onOpenAICoach: () => void;
  onBackToDashboard: () => void;
}

export function TestResultView({
  attempt,
  questions,
  bookmarkedIds,
  onToggleBookmark,
  onOpenAICoach,
  onBackToDashboard,
}: TestResultViewProps) {
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'correct' | 'partial' | 'incorrect' | 'unattempted'
  >('all');

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const slowQuestions = attempt.evaluations.filter((e) => e.tookTooLong);
  const changedCorrectToWrong = attempt.evaluations.filter(
    (e) => e.changedCorrectToIncorrect
  );

  // Topic-wise aggregation
  const topicSummary = Object.values(
    attempt.evaluations.reduce(
      (acc, ev) => {
        if (!acc[ev.category]) {
          acc[ev.category] = {
            category: ev.category,
            total: 0,
            attempted: 0,
            correct: 0,
            marks: 0,
            maxMarks: 0,
          };
        }
        acc[ev.category].total += 1;
        acc[ev.category].marks += ev.marksAwarded;
        acc[ev.category].maxMarks += ev.maxMarks;
        if (ev.status !== 'unattempted') {
          acc[ev.category].attempted += 1;
          if (ev.status === 'correct') acc[ev.category].correct += 1;
          if (ev.status === 'partial') acc[ev.category].correct += 0.5;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          category: string;
          total: number;
          attempted: number;
          correct: number;
          marks: number;
          maxMarks: number;
        }
      >
    )
  );

  // Difficulty-wise aggregation
  const difficultySummary = (['Easy', 'Medium', 'Hard'] as const).map((diff) => {
    const matching = attempt.evaluations.filter((e) => e.difficulty === diff);
    const attempted = matching.filter((e) => e.status !== 'unattempted').length;
    const correct = matching.filter((e) => e.status === 'correct').length;
    const marks = matching.reduce((s, e) => s + e.marksAwarded, 0);
    const maxMarks = matching.reduce((s, e) => s + e.maxMarks, 0);
    return {
      difficulty: diff,
      total: matching.length,
      attempted,
      correct,
      marks: Number(marks.toFixed(2)),
      maxMarks,
    };
  });

  const filteredEvaluations = attempt.evaluations.filter((ev) =>
    filterStatus === 'all' ? true : ev.status === filterStatus
  );

  return (
    <div className="space-y-8">
      {/* Top Action & Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </button>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Test Evaluation · {attempt.examTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Completed {formatDeterministicDateTime(attempt.completedAt)} · Exam Year
            Pattern: {attempt.examYear} ·{' '}
            {attempt.isDemoData
              ? 'Sample Diagnostic Data (Demo Mode)'
              : 'Recorded User Attempt'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggleButton testId="result-theme-toggle" />
          <button
            type="button"
            onClick={onOpenAICoach}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Run Gemini AI Performance Analyst
          </button>
        </div>
      </div>

      {/* Primary Score & Metric Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Total Score</div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {attempt.totalScore}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {attempt.maxPossibleScore}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Part A: {attempt.partAScore}/{attempt.partAMaxScore}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Accuracy</div>
          <div className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">
            {attempt.accuracyPercentage}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Weighted across attempted
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Correct / Partial</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
            {attempt.correctCount}{' '}
            <span className="text-sm font-normal text-slate-500">
              (+{attempt.partialCount} MSQ partial)
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Verified matches</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Incorrect / Skipped</div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums">
            {attempt.incorrectCount}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {attempt.unattemptedCount} skipped
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Attempted vs Unattempted</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Negative Marks Lost</div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {attempt.negativeMarksLost > 0
              ? `-${attempt.negativeMarksLost}`
              : '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            MSQ (-1) & MCQ (-0.71)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Total Time Spent</div>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {Math.floor(attempt.totalDurationSeconds / 60)}m{' '}
            {attempt.totalDurationSeconds % 60}s
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {slowQuestions.length} question(s) over target time
          </div>
        </div>
      </div>

      {/* Special Behavioral Diagnostics: Answer-Change Regret & Pacing Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Questions Where Correct Answer Was Changed to Incorrect
            </h2>
            <span className="font-mono text-xs font-semibold text-amber-700 tabular-nums">
              {changedCorrectToWrong.length} detected
            </span>
          </div>
          {changedCorrectToWrong.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              None detected in this session. You maintained confidence in your
              verified initial selections.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              {changedCorrectToWrong.map((ev) => (
                <li
                  key={ev.questionId}
                  className="flex items-center justify-between rounded-lg bg-amber-50/70 px-3 py-2"
                >
                  <span>
                    <strong className="font-mono">{ev.questionCode}</strong> ({ev.category})
                    — Initial correct answer was overwritten with{' '}
                    <span className="font-mono font-semibold">
                      {Array.isArray(ev.submittedAnswer)
                        ? ev.submittedAnswer.join(', ')
                        : ev.submittedAnswer}
                    </span>
                  </span>
                  <span className="font-mono text-red-700 tabular-nums">
                    Lost {ev.maxMarks + ev.negativeMarksLost}M
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Questions That Took Too Long (&gt;125% Recommended Time)
            </h2>
            <span className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
              {slowQuestions.length} flagged
            </span>
          </div>
          {slowQuestions.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              All questions were completed within target UCEED pacing thresholds.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              {slowQuestions.map((ev) => (
                <li
                  key={ev.questionId}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span>
                    <strong className="font-mono">{ev.questionCode}</strong> ({ev.category})
                  </span>
                  <span className="font-mono text-slate-800 tabular-nums">
                    {ev.timeSpentSeconds}s spent (Target: {ev.recommendedTimeSeconds}s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Topic-wise & Difficulty-wise Performance Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Topic-Wise Performance Breakdown
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">UCEED Topic</th>
                  <th className="py-2 text-right font-medium">Attempted</th>
                  <th className="py-2 text-right font-medium">Accuracy</th>
                  <th className="py-2 text-right font-medium">Net Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topicSummary.map((t) => {
                  const acc =
                    t.attempted > 0
                      ? Math.round((t.correct / t.attempted) * 100)
                      : 0;
                  return (
                    <tr key={t.category} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-medium text-slate-900">
                        {t.category}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">
                        {t.attempted} / {t.total}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                        {acc}%
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {t.marks.toFixed(2)} / {t.maxMarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Difficulty-Wise Performance
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Difficulty</th>
                  <th className="py-2 text-right font-medium">Attempted</th>
                  <th className="py-2 text-right font-medium">Correct</th>
                  <th className="py-2 text-right font-medium">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {difficultySummary.map((d) => (
                  <tr key={d.difficulty}>
                    <td className="py-2.5 font-medium text-slate-900">
                      {d.difficulty}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-600">
                      {d.attempted}/{d.total}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-emerald-700">
                      {d.correct}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {d.marks}/{d.maxMarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed 8-Point Question-by-Question Review */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Question-by-Question 8-Point Diagnostic Review
            </h2>
            <p className="text-xs text-slate-500">
              Includes your submitted response, verified answer, evidence-based
              error analysis, concept tested, practical method, and takeaway.
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['all', 'correct', 'partial', 'incorrect', 'unattempted'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                    filterStatus === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvaluations.map((ev, idx) => {
            const q = questionMap.get(ev.questionId);
            if (!q) return null;

            return (
              <div
                key={ev.questionId}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono font-bold text-slate-900">
                      #{idx + 1} · {ev.questionCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ev.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ev.questionType}</span>
                    <span aria-hidden="true">·</span>
                    <span>Difficulty: {ev.difficulty}</span>
                    {ev.isRepeatAttempt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-sky-700">
                          <RefreshCw className="h-3 w-3" /> Repeated Question
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-mono text-slate-600 tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {ev.timeSpentSeconds}s / {ev.recommendedTimeSeconds}s target
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 font-mono font-semibold tabular-nums ${
                        ev.status === 'correct'
                          ? 'text-emerald-700'
                          : ev.status === 'partial'
                          ? 'text-sky-700'
                          : ev.status === 'incorrect'
                          ? 'text-red-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {ev.status === 'correct' && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {ev.status === 'incorrect' && (
                        <XCircle className="h-4 w-4" />
                      )}
                      {ev.status === 'partial' && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {ev.status.toUpperCase()} ({ev.marksAwarded >= 0 ? '+' : ''}
                      {ev.marksAwarded} / {ev.maxMarks}M)
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(ev.questionId)}
                      className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${
                        bookmarkedIds.has(ev.questionId)
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark className="h-3 w-3" />
                      {bookmarkedIds.has(ev.questionId) ? 'Saved' : 'Bookmark'}
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-900">
                  {q.statement}
                </p>

                <QuestionDiagram diagramType={q.diagramType} />

                {/* 8 Required Post-Test Evaluation Items */}
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="text-slate-500">1. Your Submitted Answer:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {ev.submittedAnswer === null
                        ? 'Unattempted'
                        : Array.isArray(ev.submittedAnswer)
                        ? ev.submittedAnswer.join(', ')
                        : ev.submittedAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">2. Verified Correct Answer:</span>{' '}
                    <span className="font-mono font-semibold text-emerald-700">
                      {Array.isArray(ev.verifiedCorrectAnswer)
                        ? ev.verifiedCorrectAnswer.join(', ')
                        : ev.verifiedCorrectAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">3. Evaluation Status:</span>{' '}
                    <span className="font-semibold capitalize text-slate-900">
                      {ev.status}
                      {ev.changedCorrectToIncorrect
                        ? ' (Alert: Changed from initial correct answer)'
                        : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">6. Concept / Skill Tested:</span>{' '}
                    <span className="font-medium text-slate-900">
                      {q.conceptTested}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700">
                  <p>
                    <strong className="text-slate-900">
                      4. Reasoning Behind Correct Answer:
                    </strong>{' '}
                    {q.explanation}
                  </p>
                  <p>
                    <strong className="text-slate-900">
                      5. Diagnostic Analysis of Your Response:
                    </strong>{' '}
                    {ev.whyAnswerWasWrong}{' '}
                    {ev.inferredErrorCategory && (
                      <span className="text-slate-500">
                        [Classification: {ev.inferredErrorCategory} ·{' '}
                        {ev.errorConfidence === 'evidence-backed'
                          ? 'Supported by response evidence'
                          : 'Hypothesis — needs further practice'}
                        ]
                      </span>
                    )}
                  </p>
                  <p>
                    <strong className="text-slate-900">
                      7. Practical Method to Solve Similar Questions:
                    </strong>{' '}
                    {q.practicalMethod}
                  </p>
                  <p>
                    <strong className="text-slate-900">
                      8. Short Takeaway to Remember:
                    </strong>{' '}
                    {q.shortTakeaway}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
