import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { AIAnalysisReport, TestAttempt } from '@/lib/types';

// Simple in-memory rate limiter (max 10 requests per minute)
const requestTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60_000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= 10) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

function buildDeterministicReportFromAttempts(
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
    id: `ai-report-${Date.now()}`,
    generatedAt: new Date().toISOString(),
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

export async function POST(req: NextRequest) {
  if (!checkRateLimit()) {
    return NextResponse.json(
      {
        error:
          'Rate limit reached (maximum 10 AI analysis requests per minute). Please wait a moment and retry.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const attempts: TestAttempt[] = Array.isArray(body.attempts) ? body.attempts : [];
    const dailyStudyMinutes = Number(body.dailyStudyMinutes) || 90;

    if (attempts.length === 0) {
      return NextResponse.json(
        {
          error:
            'No test attempts available for analysis. Complete at least one practice or mock test first.',
        },
        { status: 400 }
      );
    }

    const fallbackReport = buildDeterministicReportFromAttempts(
      attempts,
      dailyStudyMinutes
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      // Return deterministic data-driven report when API key is not configured in local dev
      return NextResponse.json({
        report: fallbackReport,
        source: 'calibrated-engine',
      });
    }

    // Sanitize payload: send ONLY question codes, categories, response timings, and evaluation statuses (never PII/tokens)
    const sanitizedAttemptSummary = attempts.slice(0, 5).map((a) => ({
      examTitle: a.examTitle,
      examYear: a.examYear,
      totalScore: a.totalScore,
      maxPossibleScore: a.maxPossibleScore,
      accuracyPercentage: a.accuracyPercentage,
      negativeMarksLost: a.negativeMarksLost,
      evaluations: (a.evaluations || []).map((ev) => ({
        questionCode: ev.questionCode,
        category: ev.category,
        questionType: ev.questionType,
        difficulty: ev.difficulty,
        status: ev.status,
        marksAwarded: ev.marksAwarded,
        maxMarks: ev.maxMarks,
        timeSpentSeconds: ev.timeSpentSeconds,
        recommendedTimeSeconds: ev.recommendedTimeSeconds,
        tookTooLong: ev.tookTooLong,
        changedCorrectToIncorrect: ev.changedCorrectToIncorrect,
        inferredErrorCategory: ev.inferredErrorCategory,
        errorConfidence: ev.errorConfidence,
        whyAnswerWasWrong: ev.whyAnswerWasWrong,
      })),
    }));

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analyze this UCEED student's actual test attempts and generate a structured diagnostic report.
Student Daily Study Goal: ${dailyStudyMinutes} minutes/day.
Actual Sanitized Attempt Data:
${JSON.stringify(sanitizedAttemptSummary, null, 2)}

Rules:
1. Only assign an error category as "Evidence-Supported" when supported by the student's actual response data; otherwise label confidence as "Hypothesis (Needs More Attempts)".
2. Clearly distinguish hypothetical score gains from guaranteed results.
3. Generate 5 original UCEED-calibrated practice questions targeting the student's demonstrated weak topics, labeled as AI-Generated Practice.`,
      config: {
        systemInstruction:
          'You are an expert IIT Bombay UCEED exam performance analyst and design aptitude coach. Return strictly valid JSON adhering to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            performanceSummary: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  accuracy: { type: Type.NUMBER },
                  evidence: { type: Type.STRING },
                },
                required: ['topic', 'accuracy', 'evidence'],
              },
            },
            weaknesses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  impactMarks: { type: Type.NUMBER },
                },
                required: ['topic', 'issue', 'impactMarks'],
              },
            },
            errorClassification: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  occurrences: { type: Type.NUMBER },
                  confidence: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['category', 'occurrences', 'confidence', 'explanation'],
              },
            },
            personalizedRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                  actionableDrill: { type: Type.STRING },
                },
                required: ['topic', 'priority', 'whyItMatters', 'actionableDrill'],
              },
            },
            improvementPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  focusTopic: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['day', 'focusTopic', 'durationMinutes', 'tasks'],
              },
            },
            scoreImprovementOpportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  errorType: { type: Type.STRING },
                  hypotheticalMarksGain: { type: Type.NUMBER },
                  howToRecover: { type: Type.STRING },
                  disclaimer: { type: Type.STRING },
                },
                required: [
                  'errorType',
                  'hypotheticalMarksGain',
                  'howToRecover',
                  'disclaimer',
                ],
              },
            },
            generatedPracticeQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  questionType: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  statement: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  conceptTargeted: { type: Type.STRING },
                },
                required: [
                  'id',
                  'category',
                  'questionType',
                  'difficulty',
                  'statement',
                  'correctAnswer',
                  'explanation',
                  'conceptTargeted',
                ],
              },
            },
          },
          required: [
            'performanceSummary',
            'strengths',
            'weaknesses',
            'errorClassification',
            'personalizedRecommendations',
            'improvementPlan',
            'scoreImprovementOpportunities',
            'generatedPracticeQuestions',
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return NextResponse.json({
        report: fallbackReport,
        source: 'calibrated-engine',
      });
    }

    const parsed = JSON.parse(rawText);
    const validatedReport: AIAnalysisReport = {
      id: `ai-report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      basedOnAttemptsCount: attempts.length,
      performanceSummary:
        parsed.performanceSummary || fallbackReport.performanceSummary,
      strengths:
        Array.isArray(parsed.strengths) && parsed.strengths.length > 0
          ? parsed.strengths
          : fallbackReport.strengths,
      weaknesses:
        Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
          ? parsed.weaknesses
          : fallbackReport.weaknesses,
      errorClassification:
        Array.isArray(parsed.errorClassification) &&
        parsed.errorClassification.length > 0
          ? parsed.errorClassification
          : fallbackReport.errorClassification,
      personalizedRecommendations:
        Array.isArray(parsed.personalizedRecommendations) &&
        parsed.personalizedRecommendations.length > 0
          ? parsed.personalizedRecommendations
          : fallbackReport.personalizedRecommendations,
      improvementPlan:
        Array.isArray(parsed.improvementPlan) && parsed.improvementPlan.length > 0
          ? parsed.improvementPlan
          : fallbackReport.improvementPlan,
      scoreImprovementOpportunities:
        Array.isArray(parsed.scoreImprovementOpportunities) &&
        parsed.scoreImprovementOpportunities.length > 0
          ? parsed.scoreImprovementOpportunities
          : fallbackReport.scoreImprovementOpportunities,
      generatedPracticeQuestions:
        Array.isArray(parsed.generatedPracticeQuestions) &&
        parsed.generatedPracticeQuestions.length > 0
          ? parsed.generatedPracticeQuestions
          : fallbackReport.generatedPracticeQuestions,
    };

    return NextResponse.json({
      report: validatedReport,
      source: 'gemini-3.8-flash',
    });
  } catch (err) {
    console.error('AI Analyst Route Error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `AI analysis request encountered an issue (${err.message}). You can retry immediately.`
            : 'Unable to complete AI analysis. Please retry.',
      },
      { status: 500 }
    );
  }
}
