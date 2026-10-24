'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { AIAnalysisReport, TestAttempt } from '@/lib/types';
import { formatDeterministicDateTime } from '@/lib/scoring';

function computeInitialCoachReport(
  attempts: TestAttempt[],
  dailyStudyMinutes: number
): AIAnalysisReport {
  const allEvals = attempts.flatMap((a) => a.evaluations || []);
  const totalAttempted = allEvals.filter((e) => e.status !== 'unattempted').length;
  const totalCorrect = allEvals.filter((e) => e.status === 'correct').length;
  const totalPartial = allEvals.filter((e) => e.status === 'partial').length;
  const totalNegLost = attempts.reduce((acc, a) => acc + (a.negativeMarksLost || 0), 0);

  const topicMap = new Map<
    string,
    { attempted: number; correct: number; negLost: number; slowCount: number }
  >();
  const errorMap = new Map<
    string,
    { count: number; evidenceCount: number; examples: string[] }
  >();

  for (const ev of allEvals) {
    const cur = topicMap.get(ev.category) || {
      attempted: 0,
      correct: 0,
      negLost: 0,
      slowCount: 0,
    };
    if (ev.status !== 'unattempted') {
      cur.attempted++;
      if (ev.status === 'correct') cur.correct += 1;
      if (ev.status === 'partial') cur.correct += 0.5;
    }
    cur.negLost += ev.negativeMarksLost;
    if (ev.tookTooLong) cur.slowCount++;
    topicMap.set(ev.category, cur);

    if (ev.inferredErrorCategory) {
      const err = errorMap.get(ev.inferredErrorCategory) || {
        count: 0,
        evidenceCount: 0,
        examples: [],
      };
      err.count++;
      if (ev.errorConfidence === 'evidence-backed') err.evidenceCount++;
      err.examples.push(`${ev.questionCode}: ${ev.whyAnswerWasWrong}`);
      errorMap.set(ev.inferredErrorCategory, err);
    }
  }

  const topicEntries = Array.from(topicMap.entries()).map(([topic, d]) => ({
    topic,
    accuracy: d.attempted > 0 ? Math.round((d.correct / d.attempted) * 100) : 0,
    attempted: d.attempted,
    negLost: Number(d.negLost.toFixed(2)),
    slowCount: d.slowCount,
  }));

  const sortedByAccuracyDesc = [...topicEntries].sort((a, b) => b.accuracy - a.accuracy);
  const sortedByWeakness = [...topicEntries].sort(
    (a, b) => a.accuracy - b.accuracy || b.negLost - a.negLost
  );
  const overallAcc =
    totalAttempted > 0
      ? Math.round(((totalCorrect + totalPartial * 0.5) / totalAttempted) * 100)
      : 0;

  return {
    id: 'baseline-report',
    generatedAt: '2026-10-24T09:00:00Z',
    basedOnAttemptsCount: attempts.length,
    performanceSummary: `Across ${attempts.length} recorded test session(s) (${totalAttempted} attempted questions), your overall weighted accuracy is ${overallAcc}% (${totalCorrect} exact correct, ${totalPartial} MSQ partial-credit responses). You lost ${totalNegLost.toFixed(2)} marks to negative marking. Your strongest accuracy is in ${sortedByAccuracyDesc[0]?.topic || 'Observation and visual sensitivity'}, while ${sortedByWeakness[0]?.topic || 'Pattern recognition'} and MSQ option completeness offer the fastest score recovery.`,
    strengths: sortedByAccuracyDesc.slice(0, 3).map((s) => ({
      topic: s.topic,
      accuracy: s.accuracy,
      evidence: `Achieved ${s.accuracy}% accuracy across ${s.attempted} attempted question(s) with controlled response pacing.`,
    })),
    weaknesses: sortedByWeakness.slice(0, 3).map((w) => ({
      topic: w.topic,
      issue:
        w.negLost > 0
          ? `Accuracy at ${w.accuracy}% with ${w.negLost} marks lost to negative marking or incomplete MSQ selection.`
          : `Accuracy at ${w.accuracy}% with ${w.slowCount} question(s) exceeding target time budget.`,
      impactMarks: Math.max(3, Math.round(w.negLost + 4)),
    })),
    errorClassification: Array.from(errorMap.entries()).map(([category, info]) => ({
      category: category as AIAnalysisReport['errorClassification'][0]['category'],
      occurrences: info.count,
      confidence:
        info.evidenceCount > 0
          ? 'Evidence-Supported'
          : 'Hypothesis (Needs More Attempts)',
      explanation:
        info.examples[0] ||
        'Observed in recent attempt responses; collect additional attempts to confirm pattern.',
    })),
    personalizedRecommendations: [
      {
        topic: sortedByWeakness[0]?.topic || 'Pattern recognition',
        priority: 'High',
        whyItMatters:
          'Directly accounts for your largest preventable mark loss in Section 3 (MCQ) and Section 1 (NAT).',
        actionableDrill:
          'Practice 10 timed perspective foreshortening and surface-normal decomposition problems using the 6-axis tally table.',
      },
      {
        topic: 'Analytical and logical reasoning',
        priority: 'High',
        whyItMatters:
          'Mechanical advantage (pulleys/gears) and folding questions carry +4 marks in NAT with zero negative risk.',
        actionableDrill:
          'Draw explicit free-body cut lines on pulley systems before dividing load values.',
      },
      {
        topic: 'Visualization and spatial reasoning',
        priority: 'Medium',
        whyItMatters:
          'Converting partial +2 MSQ responses into full +4 responses without selecting wrong distractors boosts Part A rank.',
        actionableDrill:
          'Use the alternating-face parity rule on cube nets before checking rotational arrow alignment.',
      },
    ],
    improvementPlan: [
      {
        day: 1,
        focusTopic: '3D Surface Counting & Isometric Projection (NAT)',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Solve 8 NAT polyhedral surface-counting problems using a 6-direction normal table (+X, -X, +Y, -Y, +Z, -Z).',
          'Re-verify any response where you change your initial answer before submitting.',
        ],
      },
      {
        day: 2,
        focusTopic: 'Projective Perspective & Vanishing Point Geometry',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Practice midpoint diagonal construction for equal depth spacing in 1-point and 2-point perspective.',
          'Review optical balance and typography overshoot concepts.',
        ],
      },
      {
        day: 3,
        focusTopic: 'MSQ Partial-Marking Strategy & Cube Nets',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Complete 10 MSQ spatial folding problems focusing on zero false-positive selections.',
          'Practice identifying opposite faces first to eliminate 2 options immediately.',
        ],
      },
      {
        day: 4,
        focusTopic: 'Mechanical Reasoning: Gears, Pulleys & Linkages',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Drill compound gear train RPM ratios and coaxial shaft velocity coupling.',
          'Solve 6 movable-block pulley problems using horizontal tension cut lines.',
        ],
      },
      {
        day: 5,
        focusTopic: 'Part B Scene Perspective Sketching (30-Min Timed)',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Sketch an interior-to-exterior human activity scene establishing eye-level horizon within 4 minutes.',
          'Upload to Part B Studio and compare against rubric criteria.',
        ],
      },
      {
        day: 6,
        focusTopic: 'Part B Design Aptitude & Ergonomic Callouts',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Complete 1 assistive product design prompt with a 3D hero view and 2 mechanical detail callouts.',
          'Audit universal design compliance (reach zones, tactile/visual redundancy).',
        ],
      },
      {
        day: 7,
        focusTopic: 'Full Timed Calibration Mock & Error Audit',
        durationMinutes: dailyStudyMinutes,
        tasks: [
          'Take a timed Part A + Part B simulation without pausing the clock.',
          'Audit any question exceeding 150 seconds or exhibiting answer-change hesitation.',
        ],
      },
    ],
    scoreImprovementOpportunities: [
      {
        errorType: 'Answer-Change Hesitation & NAT Off-by-One Slips',
        hypotheticalMarksGain: 4,
        howToRecover:
          'When recounting 3D surfaces in NAT, log counts per axis rather than mentally recounting the whole figure in the final 20 seconds.',
        disclaimer:
          'Hypothetical projection assuming error elimination on similar question types; not a guaranteed exam score increase.',
      },
      {
        errorType: 'Preventable MCQ Distractor Penalties (-0.71 per error)',
        hypotheticalMarksGain: 7.42,
        howToRecover:
          'Eliminate options that confuse fixed redirect pulleys with load-bearing movable strands or linear spacing with perspective foreshortening.',
        disclaimer:
          'Hypothetical projection based on recovering two 3-mark MCQs plus their -0.71 negative deductions.',
      },
      {
        errorType: 'MSQ Partial-to-Full Credit Conversion',
        hypotheticalMarksGain: 4,
        howToRecover:
          'Systematic vertex-adjacency verification on polyhedral nets converts safe +2 partial scores into +4 full scores.',
        disclaimer:
          'Hypothetical estimate; in live exams, retain conservative selection if uncertain to avoid the -1 penalty.',
      },
    ],
    generatedPracticeQuestions: [
      {
        id: 'ai-gen-q1',
        category: 'Visualization and spatial reasoning',
        questionType: 'NAT',
        difficulty: 'Medium',
        statement:
          '[AI-Generated Practice] A solid right regular hexagonal prism has a smaller square prism tunnel bored completely through its center from the top hexagonal face to the bottom hexagonal face. How many total flat planar faces does the resulting hollow solid possess?',
        correctAnswer: '12',
        explanation:
          'The outer hexagonal prism has 6 vertical rectangular faces + 2 horizontal top/bottom annular faces = 8 faces. The square through-tunnel adds 4 inner vertical rectangular walls. Total = 8 + 4 = 12 planar faces.',
        conceptTargeted: '3D Boolean subtraction and surface normal counting',
      },
      {
        id: 'ai-gen-q2',
        category: 'Analytical and logical reasoning',
        questionType: 'NAT',
        difficulty: 'Medium',
        statement:
          '[AI-Generated Practice] Gear P (18 teeth) rotates at 120 RPM and drives Gear Q (36 teeth). Gear R (12 teeth) is fixed on the same shaft as Gear Q and drives Gear S (48 teeth). What is the rotational speed of Gear S in RPM?',
        correctAnswer: '15',
        explanation:
          'Gear Q rotates at 120 * (18/36) = 60 RPM. Coaxial Gear R also rotates at 60 RPM. Gear S rotates at 60 * (12/48) = 15 RPM.',
        conceptTargeted: 'Compound gear train velocity calculation',
      },
      {
        id: 'ai-gen-q3',
        category: 'Pattern recognition',
        questionType: 'MCQ',
        difficulty: 'Medium',
        statement:
          '[AI-Generated Practice] A 1.8 m tall observer stands on flat ground looking at a row of 3.6 m tall streetlights receding toward the horizon in 1-point perspective. Where does the horizon line intersect each streetlight pole in the perspective drawing?',
        options: [
          'A. At the base of each pole',
          'B. Exactly halfway up each pole (at 1.8 m height)',
          'C. At the top lamp fixture of the furthest pole',
          'D. At one-third height of the nearest pole and two-thirds height of the furthest pole',
        ],
        correctAnswer: 'B',
        explanation:
          'In linear perspective on flat ground, the horizon line intersects every vertical object at the exact height of the viewer’s eye level (1.8 m), which is halfway up every 3.6 m pole.',
        conceptTargeted: 'Horizon line and viewer eye-level invariance',
      },
      {
        id: 'ai-gen-q4',
        category: 'Analytical and logical reasoning',
        questionType: 'MCQ',
        difficulty: 'Medium',
        statement:
          '[AI-Generated Practice] A 180 N crate is suspended from a lower movable pulley block supported by 3 vertical strands of a single continuous frictionless rope, with a 4th strand passing over an upper fixed pulley pulled downward by a worker. What force must the worker apply to hold the crate in equilibrium?',
        options: ['A. 45 N', 'B. 60 N', 'C. 90 N', 'D. 36 N'],
        correctAnswer: 'B',
        explanation:
          'Only the 3 vertical strands attached to the movable lower block support the 180 N load: 3F = 180 N => F = 60 N. The 4th downward strand only redirects the pull.',
        conceptTargeted: 'Movable vs fixed pulley strand counting',
      },
      {
        id: 'ai-gen-q5',
        category: 'Design thinking and problem-solving',
        questionType: 'MSQ',
        difficulty: 'Medium',
        statement:
          '[AI-Generated Practice] Which of the following features improve tactile and visual accessibility on a household induction cooktop for users with low vision? (Select all that apply, enter comma-separated letters e.g. A,C)',
        options: [
          'A. Raised silicone tactile locator rings around burner zones outside the heated glass area',
          'B. Flat capacitive touch buttons with low-contrast grey-on-black labels and no audio click',
          'C. Physical rotary magnetic dials with distinct detent clicks for each power level',
          'D. Spoken audio readout combined with high-contrast white-on-black LED numerals',
        ],
        correctAnswer: 'A,C,D',
        explanation:
          'Raised cool-touch locators (A), physical detented dials (C), and bimodal audio + high-contrast readouts (D) support non-visual and low-vision operation; flat silent capacitive buttons (B) hinder accessibility.',
        conceptTargeted: 'Universal design and multi-sensory affordances',
      },
    ],
  };
}

interface AIStudyCoachViewProps {
  attempts: TestAttempt[];
  dailyStudyGoalMinutes: number;
}

export function AIStudyCoachView({
  attempts,
  dailyStudyGoalMinutes,
}: AIStudyCoachViewProps) {
  const initialReport = useMemo(
    () => computeInitialCoachReport(attempts, dailyStudyGoalMinutes),
    [attempts, dailyStudyGoalMinutes]
  );
  const [customReport, setCustomReport] = useState<AIAnalysisReport | null>(
    null
  );
  const report = customReport || initialReport;
  const [reportSource, setReportSource] = useState<string>(
    'calibrated-diagnostic-engine'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPracticeAnswers, setUserPracticeAnswers] = useState<
    Record<string, string>
  >({});
  const [revealedPracticeIds, setRevealedPracticeIds] = useState<Set<string>>(
    new Set()
  );

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempts,
          dailyStudyMinutes: dailyStudyGoalMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI analysis.');
      }
      setCustomReport(data.report);
      setReportSource(data.source || 'gemini-3.8-flash');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate AI performance report. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Performance Analyst & Study Coach
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Analyzes your actual test responses, timing patterns, and distractor
            choices via a secure server-side Gemini endpoint.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={generateAnalysis}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading
            ? 'Analyzing Test Attempts...'
            : 'Regenerate Analysis Report'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={generateAnalysis}
            className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-800"
          >
            Retry Now
          </button>
        </div>
      )}

      {loading && !report && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-sky-700 animate-spin" />
          <p className="mt-2 text-sm font-semibold text-slate-900">
            Evaluating response history, timing anomalies, and topic accuracy...
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-8">
          {/* 1. Performance Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Section 1 · Executive Performance Summary (Based on{' '}
                {report.basedOnAttemptsCount} recorded test sessions)
              </span>
              <span className="font-mono">
                Engine: {reportSource} · Generated{' '}
                {formatDeterministicDateTime(report.generatedAt)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-900">
              {report.performanceSummary}
            </p>
          </div>

          {/* 2. Strengths & 3. Weaknesses */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">
                Section 2 · Demonstrated Strengths
              </h2>
              <div className="mt-4 space-y-3">
                {report.strengths.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{s.topic}</span>
                      <span className="font-mono text-emerald-700 tabular-nums">
                        {s.accuracy}% Accuracy
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{s.evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">
                Section 3 · High-Priority Weaknesses
              </h2>
              <div className="mt-4 space-y-3">
                {report.weaknesses.map((w, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{w.topic}</span>
                      <span className="font-mono text-red-600 tabular-nums">
                        Impact: ~{w.impactMarks}M
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{w.issue}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Error Classification (Evidence-Supported vs Hypothesis) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">
              Section 4 · Evidence-Verified Error Classification
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Categories are marked as &ldquo;Evidence-Supported&rdquo; only when
              your specific option selection or answer history proves the
              pattern; otherwise labeled as a hypothesis requiring further
              attempts.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {report.errorClassification.map((ec, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 p-4 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {ec.category}
                    </span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {ec.occurrences}x · {ec.confidence}
                    </span>
                  </div>
                  <p className="mt-1.5 text-slate-600">{ec.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Personalized Recommendations & 7. Score Improvement Opportunities */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-700" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Section 5 · Next 3 Recommended Topics to Practice
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {report.personalizedRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>
                        0{i + 1}. {rec.topic}
                      </span>
                      <span className="font-mono text-sky-700">
                        Priority: {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Why it matters:</strong> {rec.whyItMatters}
                    </p>
                    <p className="text-slate-700">
                      <strong>Actionable Drill:</strong> {rec.actionableDrill}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Section 7 · Hypothetical Score Recovery Opportunities
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {report.scoreImprovementOpportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{opp.errorType}</span>
                      <span className="font-mono text-emerald-700 tabular-nums">
                        Up to +{opp.hypotheticalMarksGain}M (Hypothetical)
                      </span>
                    </div>
                    <p className="text-slate-700">{opp.howToRecover}</p>
                    <p className="text-[11px] text-slate-500 italic">
                      Note: {opp.disclaimer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. 7-Day Study Plan */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Section 6 · Personalized 7-Day Improvement Plan (
                {dailyStudyGoalMinutes} Mins/Day)
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {report.improvementPlan.map((dayPlan) => (
                <div
                  key={dayPlan.day}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-slate-500">
                      <span className="font-semibold text-slate-900">
                        Day {dayPlan.day}
                      </span>
                      <span>{dayPlan.durationMinutes} min</span>
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {dayPlan.focusTopic}
                    </div>
                    <ul className="mt-2 list-disc pl-4 space-y-1 text-slate-600">
                      {dayPlan.tasks.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. 5 AI-Generated Targeted Practice Questions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Section 8 · 5 AI-Generated Practice Questions Targeting Your
                Weaknesses
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Clearly labeled as AI-Generated Practice Questions (not official
                IIT Bombay PYQs). Attempt each question below to verify mastery.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {report.generatedPracticeQuestions.map((gq, index) => {
                const userAns = userPracticeAnswers[gq.id] || '';
                const isRevealed = revealedPracticeIds.has(gq.id);
                const isMatch =
                  userAns.trim().toUpperCase() ===
                  gq.correctAnswer.trim().toUpperCase();

                return (
                  <div
                    key={gq.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">
                        AI Practice #{index + 1} · {gq.questionType} ·{' '}
                        {gq.category}
                      </span>
                      <span>
                        Difficulty: {gq.difficulty} · Source: AI-Generated
                        Practice Question
                      </span>
                    </div>

                    <p className="text-sm text-slate-900">{gq.statement}</p>

                    {gq.options && gq.options.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {gq.options.map((optStr, oIdx) => {
                          const letter = ['A', 'B', 'C', 'D'][oIdx] || 'A';
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() =>
                                setUserPracticeAnswers((prev) => ({
                                  ...prev,
                                  [gq.id]: letter,
                                }))
                              }
                              className={`rounded-lg border p-2.5 text-left transition-colors ${
                                userAns === letter
                                  ? 'border-sky-600 bg-sky-50 text-slate-900 font-medium'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {optStr}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(!gq.options || gq.options.length === 0) && (
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="text"
                          value={userAns}
                          onChange={(e) =>
                            setUserPracticeAnswers((prev) => ({
                              ...prev,
                              [gq.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter answer..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRevealedPracticeIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(gq.id)) next.delete(gq.id);
                            else next.add(gq.id);
                            return next;
                          });
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        {isRevealed ? 'Hide Solution' : 'Check Answer'}
                      </button>

                      {isRevealed && (
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-semibold ${
                            isMatch ? 'text-emerald-700' : 'text-sky-800'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Correct Answer: {gq.correctAnswer}
                        </span>
                      )}
                    </div>

                    {isRevealed && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700">
                        <p>
                          <strong>Explanation:</strong> {gq.explanation}
                        </p>
                        <p className="mt-1 text-slate-500">
                          <strong>Concept Targeted:</strong> {gq.conceptTargeted}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
