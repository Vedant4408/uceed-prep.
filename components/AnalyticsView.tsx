'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronRight, Play, X } from 'lucide-react';
import { computeAnalyticsSummary } from '@/lib/scoring';
import { getChartThemeConfig } from '@/lib/theme';
import { TestAttempt } from '@/lib/types';
import { useTheme } from './ThemeProvider';

interface AnalyticsViewProps {
  attempts: TestAttempt[];
  onPracticeTopic?: (category: string) => void;
}

export function AnalyticsView({
  attempts,
  onPracticeTopic,
}: AnalyticsViewProps) {
  const { theme } = useTheme();
  const chartTheme = getChartThemeConfig(theme);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredAttempts = useMemo(() => {
    const now = new Date('2026-10-24T12:00:00Z').getTime();
    return attempts.filter((a) => {
      if (selectedAttemptId !== 'all' && a.id !== selectedAttemptId) {
        return false;
      }
      if (timeFilter === 'all') return true;
      const completedTime = new Date(a.completedAt).getTime();
      const daysDiff = (now - completedTime) / (1000 * 60 * 60 * 24);
      if (timeFilter === '7d') return daysDiff <= 7;
      if (timeFilter === '30d') return daysDiff <= 30;
      return true;
    });
  }, [attempts, timeFilter, selectedAttemptId]);

  const summary = useMemo(
    () => computeAnalyticsSummary(filteredAttempts),
    [filteredAttempts]
  );

  const scoreTrendData = useMemo(() => {
    return [...filteredAttempts]
      .reverse()
      .map((a, i) => ({
        session: `Test ${i + 1}`,
        title: a.examTitle,
        scorePct:
          a.maxPossibleScore > 0
            ? Math.round((a.totalScore / a.maxPossibleScore) * 100)
            : 0,
        accuracy: a.accuracyPercentage,
      }));
  }, [filteredAttempts]);

  const errorChartData = useMemo(() => {
    return Object.entries(summary.errorCounts).map(([category, count]) => ({
      category:
        category.length > 26 ? category.slice(0, 24) + '…' : category,
      fullCategory: category,
      count,
    }));
  }, [summary.errorCounts]);

  const activeTopicDetail = useMemo(() => {
    if (!selectedTopic) return null;
    return (
      summary.topicBreakdown.find((t) => t.topic === selectedTopic) || null
    );
  }, [summary.topicBreakdown, selectedTopic]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Timeframe Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Personal Progress Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tracks topic accuracy, response pacing, error categories, and
            strictly separates Unseen Questions from Repeated Questions. Tap any
            topic below to drill down into individual question diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeFilter(tab.id)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  timeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label htmlFor="analytics-test-select" className="sr-only">
            Filter by Selected Test
          </label>
          <select
            id="analytics-test-select"
            value={selectedAttemptId}
            onChange={(e) => setSelectedAttemptId(e.target.value)}
            className="min-h-[38px] w-full sm:w-auto max-w-full truncate rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-sky-600 focus:outline-none"
          >
            <option value="all">All Recorded Tests ({attempts.length})</option>
            {attempts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.examTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unseen vs Repeated Question Separation Banner */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">
                First-Attempt Performance on Unseen Questions
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {summary.unseenAccuracy}%
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-500 tabular-nums">
              {summary.unseenAttempted} unseen questions attempted
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            True exam readiness indicator: measures accuracy strictly on
            questions encountered for the first time.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Revision Performance on Repeated Questions
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
                {summary.repeatedAccuracy}%
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-500 tabular-nums">
              {summary.repeatedAttempted} repeated questions attempted
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Tracked separately from unseen questions so memory recall on
            re-attempted PYQs never inflates your diagnostic accuracy.
          </p>
        </div>
      </div>

      {/* Charts Row: Topic Accuracy & Score Trend Over Time */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Accuracy by UCEED Topic (%)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Weighted accuracy across attempted questions per topic
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.topicBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 16, left: 8, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartTheme.gridStroke}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={chartTheme.axisLineColor}
                  tick={{ fontSize: 10, fill: chartTheme.axisTickColor }}
                />
                <YAxis
                  dataKey="topic"
                  type="category"
                  width={130}
                  stroke={chartTheme.axisLineColor}
                  tick={{ fontSize: 10, fill: chartTheme.axisTickColor }}
                  tickFormatter={(v) =>
                    String(v).length > 18 ? `${String(v).slice(0, 18)}…` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                  labelStyle={{ color: chartTheme.tooltipLabel, fontWeight: 600 }}
                />
                <Bar
                  dataKey="accuracy"
                  fill={chartTheme.primarySeries}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Score % & Accuracy Trend Over Time
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Progression across completed practice and mock sessions
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={scoreTrendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartTheme.gridStroke}
                />
                <XAxis
                  dataKey="session"
                  stroke={chartTheme.axisLineColor}
                  tick={{ fontSize: 11, fill: chartTheme.axisTickColor }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={chartTheme.axisLineColor}
                  tick={{ fontSize: 11, fill: chartTheme.axisTickColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                  labelStyle={{ color: chartTheme.tooltipLabel, fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy %"
                  stroke={chartTheme.primarySeries}
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="scorePct"
                  name="Score % of Max"
                  stroke={chartTheme.successSeries}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Topic Drill-Down Panel */}
      {activeTopicDetail && (
        <div
          data-testid="topic-drilldown-panel"
          className="rounded-xl border-2 border-sky-600 bg-sky-50/40 p-4 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-200 pb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Topic Diagnostic Drill-Down
              </div>
              <h3 className="mt-0.5 text-base font-bold text-slate-900">
                {activeTopicDetail.topic}
              </h3>
              <p className="text-xs text-slate-600">
                Accuracy: {activeTopicDetail.accuracy}% · Attempted:{' '}
                {activeTopicDetail.attempted} · Avg Time:{' '}
                {activeTopicDetail.avgTimeSeconds}s · Marks:{' '}
                {activeTopicDetail.marksEarned}/{activeTopicDetail.maxMarks}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onPracticeTopic && (
                <button
                  type="button"
                  onClick={() => onPracticeTopic(activeTopicDetail.topic)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                >
                  <Play className="h-3.5 w-3.5" />
                  Practice This Topic
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                aria-label="Close topic drill-down"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {(activeTopicDetail.evaluations || []).map((ev, idx) => (
              <div
                key={`${ev.questionId}-${idx}`}
                className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">
                    {ev.questionCode} ({ev.questionType})
                  </span>
                  <span
                    className={`font-mono font-semibold uppercase ${
                      ev.status === 'correct'
                        ? 'text-emerald-700'
                        : ev.status === 'partial'
                        ? 'text-amber-700'
                        : ev.status === 'incorrect'
                        ? 'text-red-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {ev.status} ({ev.marksAwarded >= 0 ? '+' : ''}
                    {ev.marksAwarded}M)
                  </span>
                </div>
                <p className="text-slate-600">{ev.whyAnswerWasWrong}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>
                    Time: {ev.timeSpentSeconds}s (Rec: {ev.recommendedTimeSeconds}
                    s)
                  </span>
                  <span>Error: {ev.inferredErrorCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Mastery & Time Pacing (Responsive Mobile Cards + Desktop Table) + Error Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Topic Mastery, Attempted vs Skipped & Time Pacing
              </h2>
              <p className="text-xs text-slate-500">
                Tap any topic row or card to inspect question-level performance
              </p>
            </div>
          </div>

          {/* Mobile Responsive Cards (< md) */}
          <div className="mt-4 space-y-2.5 md:hidden">
            {summary.topicBreakdown.map((row) => {
              const isSelected = selectedTopic === row.topic;
              return (
                <button
                  key={row.topic}
                  type="button"
                  onClick={() =>
                    setSelectedTopic(isSelected ? null : row.topic)
                  }
                  className={`w-full rounded-lg border p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/60'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {row.topic}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-sky-700">
                      {row.accuracy}%
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">
                        Attempted
                      </span>
                      {row.attempted}
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">
                        Skipped
                      </span>
                      {row.unattempted}
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">
                        Avg Time
                      </span>
                      {row.avgTimeSeconds}s
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">
                        Marks
                      </span>
                      {row.marksEarned}/{row.maxMarks}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="mt-4 hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Category (Tap to Inspect)</th>
                  <th className="py-2 text-right font-medium">Attempted</th>
                  <th className="py-2 text-right font-medium">Skipped</th>
                  <th className="py-2 text-right font-medium">Avg Time/Q</th>
                  <th className="py-2 text-right font-medium">Accuracy</th>
                  <th className="py-2 text-right font-medium">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.topicBreakdown.map((row) => {
                  const isSelected = selectedTopic === row.topic;
                  return (
                    <tr
                      key={row.topic}
                      onClick={() =>
                        setSelectedTopic(isSelected ? null : row.topic)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 font-medium text-slate-900 flex items-center gap-1.5">
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-sky-700 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                        {row.topic}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                        {row.attempted}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-500">
                        {row.unattempted}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-700">
                        {row.avgTimeSeconds}s
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-sky-700">
                        {row.accuracy}%
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                        {row.marksEarned}/{row.maxMarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Most Frequent Error Categories
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Derived from option diagnostics and pacing logs
          </p>
          {errorChartData.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              No errors recorded in the selected filter range.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {errorChartData.map((err) => (
                <div
                  key={err.fullCategory}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs"
                >
                  <span className="text-slate-800">{err.fullCategory}</span>
                  <span className="font-mono font-semibold text-amber-700 tabular-nums">
                    {err.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
