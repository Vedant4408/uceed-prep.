import {
  AIAnalysisReport,
  AttemptResponse,
  DifficultyLevel,
  ErrorCategory,
  ExamPart,
  Question,
  QuestionEvaluationResult,
  QuestionType,
  SourceClassification,
  TestAttempt,
  UCEEDCategory,
  VerificationStatus,
} from './types';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Deterministic, timezone-invariant date formatter so Server-Side Rendering (SSR)
 * and Client hydration produce identical text across all locales and timezones.
 */
export function formatDeterministicDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const year = d.getUTCFullYear();
  const month = MONTHS_SHORT[d.getUTCMonth()] || 'Jan';
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day} ${month} ${year}`;
}

/**
 * Deterministic, timezone-invariant date+time formatter (UTC).
 */
export function formatDeterministicDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const datePart = formatDeterministicDate(isoString);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  return `${datePart}, ${hours}:${mins} UTC`;
}

/**
 * Returns the canonical verification status of a question.
 */
export function getQuestionVerificationStatus(q: Question): VerificationStatus {
  if (q.verificationStatus) return q.verificationStatus;
  if (
    q.sourceClassification === 'Official UCEED PYQ (IIT Bombay Verified Key)' ||
    q.sourceClassification === 'Official UCEED Structure (Verified Pattern)'
  ) {
    return 'Verified Official PYQ';
  }
  if (
    q.sourceClassification ===
    'Imported Question (Awaiting Moderator Verification)'
  ) {
    return 'Imported (Awaiting Verification)';
  }
  if (q.sourceClassification === 'AI-Generated Targeted Practice') {
    return 'AI-Generated Practice Question';
  }
  return 'Original Practice Question';
}

/**
 * Checks whether a single answer matches the question's verified correct answer.
 */
export function isAnswerExactMatch(
  question: Question,
  submitted: string | string[] | null | undefined
): boolean {
  if (submitted === null || submitted === undefined) return false;

  if (question.questionType === 'NAT') {
    const subStr = Array.isArray(submitted) ? submitted[0] : submitted;
    if (!subStr || subStr.trim() === '') return false;
    const subNum = Number(subStr.trim());
    const targetNum = Number(
      Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer
    );
    if (Number.isNaN(subNum) || Number.isNaN(targetNum)) return false;
    const tolerance = question.markingRule.natTolerance ?? 0.01;
    return Math.abs(subNum - targetNum) <= tolerance;
  }

  if (question.questionType === 'MCQ') {
    const subStr = Array.isArray(submitted) ? submitted[0] : submitted;
    const targetStr = Array.isArray(question.correctAnswer)
      ? question.correctAnswer[0]
      : question.correctAnswer;
    return (
      (subStr ?? '').trim().toUpperCase() === targetStr.trim().toUpperCase()
    );
  }

  if (question.questionType === 'MSQ') {
    const subArr = (Array.isArray(submitted) ? submitted : [submitted])
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .sort();
    const targetArr = (
      Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer]
    )
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .sort();

    if (subArr.length === 0 || subArr.length !== targetArr.length) return false;
    return subArr.every((val, idx) => val === targetArr[idx]);
  }

  if (question.questionType === 'DRAWING') {
    const subStr = Array.isArray(submitted) ? submitted[0] : submitted;
    return Boolean(subStr && subStr.trim().length > 0);
  }

  return false;
}

/**
 * Evaluates a single question response according to official UCEED marking rules
 * for that exam year and section.
 */
export function evaluateQuestionResponse(
  question: Question,
  response: AttemptResponse
): QuestionEvaluationResult {
  const submitted = response.submittedAnswer;
  const isUnattempted =
    submitted === null ||
    submitted === undefined ||
    (typeof submitted === 'string' && submitted.trim() === '') ||
    (Array.isArray(submitted) && submitted.length === 0);

  const tookTooLong =
    response.timeSpentSeconds > question.recommendedTimeSeconds * 1.25;

  const hadCorrectEarlier = (response.answerHistory || []).some((entry) =>
    isAnswerExactMatch(question, entry.value)
  );
  const currentlyExactCorrect = isAnswerExactMatch(question, submitted);
  const changedCorrectToIncorrect =
    hadCorrectEarlier && !currentlyExactCorrect;

  if (isUnattempted) {
    return {
      questionId: question.id,
      questionCode: question.code,
      category: question.category,
      difficulty: question.difficulty,
      questionType: question.questionType,
      part: question.part,
      status: 'unattempted',
      marksAwarded: 0,
      maxMarks: question.markingRule.maxMarks,
      negativeMarksLost: 0,
      submittedAnswer: null,
      verifiedCorrectAnswer: question.correctAnswer,
      timeSpentSeconds: response.timeSpentSeconds,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tookTooLong,
      changedCorrectToIncorrect,
      isRepeatAttempt: response.isRepeatAttempt,
      inferredErrorCategory: tookTooLong
        ? 'Time-management problem'
        : undefined,
      errorConfidence: tookTooLong ? 'evidence-backed' : 'none',
      whyAnswerWasWrong:
        'Question was left unattempted. No negative marks were deducted.',
    };
  }

  // NAT Evaluation (+4 for correct, 0 for incorrect)
  if (question.questionType === 'NAT') {
    if (currentlyExactCorrect) {
      return {
        questionId: question.id,
        questionCode: question.code,
        category: question.category,
        difficulty: question.difficulty,
        questionType: question.questionType,
        part: question.part,
        status: 'correct',
        marksAwarded: question.markingRule.maxMarks,
        maxMarks: question.markingRule.maxMarks,
        negativeMarksLost: 0,
        submittedAnswer: submitted,
        verifiedCorrectAnswer: question.correctAnswer,
        timeSpentSeconds: response.timeSpentSeconds,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        tookTooLong,
        changedCorrectToIncorrect: false,
        isRepeatAttempt: response.isRepeatAttempt,
        errorConfidence: 'none',
        whyAnswerWasWrong:
          'Your numerical response matches the official answer key.',
      };
    }

    const subVal = Number(Array.isArray(submitted) ? submitted[0] : submitted);
    const targetVal = Number(
      Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer
    );
    const isOffByOneOrTwo =
      !Number.isNaN(subVal) &&
      !Number.isNaN(targetVal) &&
      Math.abs(subVal - targetVal) <= 2;

    const inferredError: ErrorCategory = isOffByOneOrTwo
      ? 'Calculation error'
      : 'Needs further practice (insufficient evidence)';

    return {
      questionId: question.id,
      questionCode: question.code,
      category: question.category,
      difficulty: question.difficulty,
      questionType: question.questionType,
      part: question.part,
      status: 'incorrect',
      marksAwarded:
        question.markingRule.negativeMarks > 0
          ? -Math.abs(question.markingRule.negativeMarks)
          : 0,
      maxMarks: question.markingRule.maxMarks,
      negativeMarksLost: Math.abs(question.markingRule.negativeMarks),
      submittedAnswer: submitted,
      verifiedCorrectAnswer: question.correctAnswer,
      timeSpentSeconds: response.timeSpentSeconds,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tookTooLong,
      changedCorrectToIncorrect,
      isRepeatAttempt: response.isRepeatAttempt,
      inferredErrorCategory: inferredError,
      errorConfidence: isOffByOneOrTwo ? 'evidence-backed' : 'hypothesis',
      whyAnswerWasWrong: isOffByOneOrTwo
        ? `You entered ${subVal}, which is very close to the verified answer (${targetVal}). This indicates a minor counting or arithmetic slip (${question.commonMistakeNote}).`
        : `You entered ${subVal}, whereas the verified answer is ${targetVal}. Because a single numerical input does not uniquely isolate the intermediate step, this pattern needs further practice. Common pitfall: ${question.commonMistakeNote}`,
    };
  }

  // MCQ Evaluation (+3 for correct, -0.71 for incorrect)
  if (question.questionType === 'MCQ') {
    const selectedId = (Array.isArray(submitted) ? submitted[0] : submitted)
      .trim()
      .toUpperCase();

    if (currentlyExactCorrect) {
      return {
        questionId: question.id,
        questionCode: question.code,
        category: question.category,
        difficulty: question.difficulty,
        questionType: question.questionType,
        part: question.part,
        status: 'correct',
        marksAwarded: question.markingRule.maxMarks,
        maxMarks: question.markingRule.maxMarks,
        negativeMarksLost: 0,
        submittedAnswer: selectedId,
        verifiedCorrectAnswer: question.correctAnswer,
        timeSpentSeconds: response.timeSpentSeconds,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        tookTooLong,
        changedCorrectToIncorrect: false,
        isRepeatAttempt: response.isRepeatAttempt,
        errorConfidence: 'none',
        whyAnswerWasWrong: 'Your selected option is correct.',
      };
    }

    const chosenOption = question.options?.find(
      (opt) => opt.id.toUpperCase() === selectedId
    );
    const hasSpecificDiagnostic = Boolean(chosenOption?.diagnosticIfSelected);
    const neg = Math.abs(question.markingRule.negativeMarks);

    return {
      questionId: question.id,
      questionCode: question.code,
      category: question.category,
      difficulty: question.difficulty,
      questionType: question.questionType,
      part: question.part,
      status: 'incorrect',
      marksAwarded: neg > 0 ? Number((-neg).toFixed(2)) : 0,
      maxMarks: question.markingRule.maxMarks,
      negativeMarksLost: neg,
      submittedAnswer: selectedId,
      verifiedCorrectAnswer: question.correctAnswer,
      timeSpentSeconds: response.timeSpentSeconds,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tookTooLong,
      changedCorrectToIncorrect,
      isRepeatAttempt: response.isRepeatAttempt,
      inferredErrorCategory:
        chosenOption?.inferredErrorCategory ||
        'Needs further practice (insufficient evidence)',
      errorConfidence: hasSpecificDiagnostic ? 'evidence-backed' : 'hypothesis',
      whyAnswerWasWrong: chosenOption?.diagnosticIfSelected
        ? `Option ${selectedId}: ${chosenOption.diagnosticIfSelected}`
        : `You selected Option ${selectedId}, while the verified answer is ${question.correctAnswer}. The pattern needs further practice to isolate the exact step.`,
    };
  }

  // MSQ Evaluation (Official UCEED Partial Marking Scheme)
  if (question.questionType === 'MSQ') {
    const selectedSet = new Set(
      (Array.isArray(submitted) ? submitted : [submitted])
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    );
    const correctArr = (
      Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer]
    )
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const correctSet = new Set(correctArr);

    let chosenCorrectCount = 0;
    let chosenWrongCount = 0;
    const wrongChosenIds: string[] = [];

    for (const sel of selectedSet) {
      if (correctSet.has(sel)) {
        chosenCorrectCount++;
      } else {
        chosenWrongCount++;
        wrongChosenIds.push(sel);
      }
    }

    if (chosenWrongCount === 0 && chosenCorrectCount === correctSet.size) {
      return {
        questionId: question.id,
        questionCode: question.code,
        category: question.category,
        difficulty: question.difficulty,
        questionType: question.questionType,
        part: question.part,
        status: 'correct',
        marksAwarded: question.markingRule.maxMarks,
        maxMarks: question.markingRule.maxMarks,
        negativeMarksLost: 0,
        submittedAnswer: Array.from(selectedSet).sort(),
        verifiedCorrectAnswer: correctArr,
        timeSpentSeconds: response.timeSpentSeconds,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        tookTooLong,
        changedCorrectToIncorrect: false,
        isRepeatAttempt: response.isRepeatAttempt,
        errorConfidence: 'none',
        whyAnswerWasWrong:
          'All correct options were selected with zero incorrect options.',
      };
    }

    if (
      chosenWrongCount === 0 &&
      chosenCorrectCount > 0 &&
      question.markingRule.partialMarkingAllowed
    ) {
      let partialMarks = 1;
      const totalCorrect = correctSet.size;
      if (totalCorrect === 4 && chosenCorrectCount === 3) partialMarks = 3;
      else if (
        (totalCorrect === 3 || totalCorrect === 4) &&
        chosenCorrectCount === 2
      )
        partialMarks = 2;
      else partialMarks = 1;

      const missedIds = correctArr.filter((c) => !selectedSet.has(c));

      return {
        questionId: question.id,
        questionCode: question.code,
        category: question.category,
        difficulty: question.difficulty,
        questionType: question.questionType,
        part: question.part,
        status: 'partial',
        marksAwarded: partialMarks,
        maxMarks: question.markingRule.maxMarks,
        negativeMarksLost: 0,
        submittedAnswer: Array.from(selectedSet).sort(),
        verifiedCorrectAnswer: correctArr,
        timeSpentSeconds: response.timeSpentSeconds,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        tookTooLong,
        changedCorrectToIncorrect,
        isRepeatAttempt: response.isRepeatAttempt,
        inferredErrorCategory: 'Incomplete answer',
        errorConfidence: 'evidence-backed',
        whyAnswerWasWrong: `Partial credit (+${partialMarks}) awarded. You avoided wrong options, but missed valid option(s): ${missedIds.join(', ')}.`,
      };
    }

    const neg = Math.abs(question.markingRule.negativeMarks);
    const wrongDiagnostics = wrongChosenIds
      .map(
        (id) =>
          question.options?.find((o) => o.id.toUpperCase() === id)
            ?.diagnosticIfSelected
      )
      .filter(Boolean);

    return {
      questionId: question.id,
      questionCode: question.code,
      category: question.category,
      difficulty: question.difficulty,
      questionType: question.questionType,
      part: question.part,
      status: 'incorrect',
      marksAwarded: neg > 0 ? Number((-neg).toFixed(2)) : 0,
      maxMarks: question.markingRule.maxMarks,
      negativeMarksLost: neg,
      submittedAnswer: Array.from(selectedSet).sort(),
      verifiedCorrectAnswer: correctArr,
      timeSpentSeconds: response.timeSpentSeconds,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tookTooLong,
      changedCorrectToIncorrect,
      isRepeatAttempt: response.isRepeatAttempt,
      inferredErrorCategory:
        wrongDiagnostics.length > 0
          ? 'Incorrect visual observation'
          : 'Guessing or poor elimination',
      errorConfidence:
        wrongDiagnostics.length > 0 ? 'evidence-backed' : 'hypothesis',
      whyAnswerWasWrong:
        wrongDiagnostics.length > 0
          ? `Selecting incorrect option(s) [${wrongChosenIds.join(', ')}] triggered -${neg} mark: ${wrongDiagnostics.join(' ')}`
          : `Selecting incorrect option(s) [${wrongChosenIds.join(', ')}] nullifies partial credit and deducts ${neg} mark.`,
    };
  }

  return {
    questionId: question.id,
    questionCode: question.code,
    category: question.category,
    difficulty: question.difficulty,
    questionType: question.questionType,
    part: question.part,
    status: 'correct',
    marksAwarded: Math.round(question.markingRule.maxMarks * 0.72),
    maxMarks: question.markingRule.maxMarks,
    negativeMarksLost: 0,
    submittedAnswer: submitted,
    verifiedCorrectAnswer: question.correctAnswer,
    timeSpentSeconds: response.timeSpentSeconds,
    recommendedTimeSeconds: question.recommendedTimeSeconds,
    tookTooLong,
    changedCorrectToIncorrect: false,
    isRepeatAttempt: response.isRepeatAttempt,
    errorConfidence: 'none',
    whyAnswerWasWrong:
      'Part B Drawing response recorded. Use Part B Studio for rubric-level visual evaluation.',
  };
}

/**
 * Evaluates a complete test attempt across a list of questions and responses.
 */
export function evaluateTestAttempt(params: {
  id: string;
  examId: string;
  examTitle: string;
  examYear: number;
  mode: 'exam' | 'practice';
  startedAt: string;
  completedAt: string;
  questions: Question[];
  responses: AttemptResponse[];
  isDemoData?: boolean;
  syncStatus?: 'synced' | 'pending-offline-sync';
}): TestAttempt {
  const responseMap = new Map<string, AttemptResponse>();
  for (const r of params.responses) {
    responseMap.set(r.questionId, r);
  }

  const evaluations: QuestionEvaluationResult[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;
  let partAScore = 0;
  let partAMaxScore = 0;
  let partBScore = 0;
  let partBMaxScore = 0;
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let negativeMarksLost = 0;
  let totalDurationSeconds = 0;

  for (const q of params.questions) {
    const resp: AttemptResponse = responseMap.get(q.id) || {
      questionId: q.id,
      submittedAnswer: null,
      isMarkedForReview: false,
      timeSpentSeconds: 0,
      answerHistory: [],
      isRepeatAttempt: false,
    };

    const evalResult = evaluateQuestionResponse(q, resp);
    evaluations.push(evalResult);

    totalScore += evalResult.marksAwarded;
    maxPossibleScore += evalResult.maxMarks;
    negativeMarksLost += evalResult.negativeMarksLost;
    totalDurationSeconds += resp.timeSpentSeconds;

    if (q.part === 'Part A') {
      partAScore += evalResult.marksAwarded;
      partAMaxScore += evalResult.maxMarks;
    } else {
      partBScore += evalResult.marksAwarded;
      partBMaxScore += evalResult.maxMarks;
    }

    if (evalResult.status === 'correct') correctCount++;
    else if (evalResult.status === 'partial') partialCount++;
    else if (evalResult.status === 'incorrect') incorrectCount++;
    else unattemptedCount++;
  }

  const attemptedCount = correctCount + partialCount + incorrectCount;
  const accuracyPercentage =
    attemptedCount > 0
      ? Number(
          (
            ((correctCount + partialCount * 0.5) / attemptedCount) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    id: params.id,
    examId: params.examId,
    examTitle: params.examTitle,
    examYear: params.examYear,
    mode: params.mode,
    startedAt: params.startedAt,
    completedAt: params.completedAt,
    totalDurationSeconds,
    totalScore: Number(totalScore.toFixed(2)),
    maxPossibleScore,
    partAScore: Number(partAScore.toFixed(2)),
    partAMaxScore,
    partBScore: Number(partBScore.toFixed(2)),
    partBMaxScore,
    accuracyPercentage,
    correctCount,
    partialCount,
    incorrectCount,
    unattemptedCount,
    negativeMarksLost: Number(negativeMarksLost.toFixed(2)),
    responses: params.responses,
    evaluations,
    isDemoData: params.isDemoData,
    syncStatus: params.syncStatus || 'synced',
  };
}

/**
 * Separates unseen vs repeated attempts and computes topic/difficulty analytics.
 */
export function computeAnalyticsSummary(attempts: TestAttempt[]) {
  let unseenAttempted = 0;
  let unseenCorrect = 0;
  let repeatedAttempted = 0;
  let repeatedCorrect = 0;

  const topicStats: Record<
    string,
    {
      topic: string;
      attempted: number;
      correct: number;
      partial: number;
      incorrect: number;
      unattempted: number;
      totalTimeSeconds: number;
      marksEarned: number;
      maxMarks: number;
      evaluations: QuestionEvaluationResult[];
    }
  > = {};

  const errorCounts: Record<string, number> = {};

  for (const attempt of attempts) {
    for (const ev of attempt.evaluations) {
      if (!topicStats[ev.category]) {
        topicStats[ev.category] = {
          topic: ev.category,
          attempted: 0,
          correct: 0,
          partial: 0,
          incorrect: 0,
          unattempted: 0,
          totalTimeSeconds: 0,
          marksEarned: 0,
          maxMarks: 0,
          evaluations: [],
        };
      }
      const st = topicStats[ev.category];
      st.totalTimeSeconds += ev.timeSpentSeconds;
      st.marksEarned += ev.marksAwarded;
      st.maxMarks += ev.maxMarks;
      st.evaluations.push(ev);

      if (ev.status === 'unattempted') {
        st.unattempted++;
      } else {
        st.attempted++;
        if (ev.status === 'correct') st.correct++;
        else if (ev.status === 'partial') st.partial++;
        else st.incorrect++;

        if (ev.isRepeatAttempt) {
          repeatedAttempted++;
          if (ev.status === 'correct' || ev.status === 'partial') {
            repeatedCorrect += ev.status === 'correct' ? 1 : 0.5;
          }
        } else {
          unseenAttempted++;
          if (ev.status === 'correct' || ev.status === 'partial') {
            unseenCorrect += ev.status === 'correct' ? 1 : 0.5;
          }
        }
      }

      if (ev.inferredErrorCategory) {
        errorCounts[ev.inferredErrorCategory] =
          (errorCounts[ev.inferredErrorCategory] || 0) + 1;
      }
    }
  }

  const unseenAccuracy =
    unseenAttempted > 0
      ? Number(((unseenCorrect / unseenAttempted) * 100).toFixed(1))
      : 0;
  const repeatedAccuracy =
    repeatedAttempted > 0
      ? Number(((repeatedCorrect / repeatedAttempted) * 100).toFixed(1))
      : 0;

  return {
    unseenAttempted,
    unseenAccuracy,
    repeatedAttempted,
    repeatedAccuracy,
    topicBreakdown: Object.values(topicStats).map((t) => ({
      ...t,
      marksEarned: Number(t.marksEarned.toFixed(2)),
      accuracy:
        t.attempted > 0
          ? Number(
              (((t.correct + t.partial * 0.5) / t.attempted) * 100).toFixed(1)
            )
          : 0,
      avgTimeSeconds:
        t.attempted + t.unattempted > 0
          ? Math.round(t.totalTimeSeconds / (t.attempted + t.unattempted))
          : 0,
    })),
    errorCounts,
  };
}

export interface CsvValidationIssue {
  rowNumber: number;
  code: string;
  errors: string[];
}

const VALID_PARTS: ExamPart[] = ['Part A', 'Part B'];
const VALID_TYPES: QuestionType[] = ['NAT', 'MSQ', 'MCQ', 'DRAWING'];
const VALID_DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

/**
 * Validates CSV question import data for the Admin Content Studio.
 * Checks for missing fields, duplicate codes (within batch and against existing bank),
 * invalid answer formats, and invalid marking rules.
 */
export function parseAndValidateQuestionCsv(
  csvText: string,
  existingCodes: Set<string> = new Set()
): {
  validQuestions: Question[];
  invalidRows: CsvValidationIssue[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      validQuestions: [],
      invalidRows: [
        {
          rowNumber: 1,
          code: 'HEADER',
          errors: ['CSV must include a header row and at least one data row.'],
        },
      ],
    };
  }

  const validQuestions: Question[] = [];
  const invalidRows: CsvValidationIssue[] = [];
  const seenCodesInBatch = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cols =
      lines[i]
        .match(/(".*?"|[^",]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g)
        ?.map((c) => c.replace(/^"|"$/g, '').trim()) || [];

    const [
      code = '',
      yearStr = '',
      part = '',
      questionType = '',
      category = '',
      subtopic = '',
      difficulty = '',
      maxMarksStr = '',
      negativeMarksStr = '',
      statement = '',
      optionA = '',
      optionB = '',
      optionC = '',
      optionD = '',
      correctAnswerRaw = '',
      explanation = '',
      sourceClassification = 'Imported Question (Awaiting Moderator Verification)',
    ] = cols;

    const rowErrors: string[] = [];
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      rowErrors.push('Missing question code.');
    } else if (existingCodes.has(normalizedCode)) {
      rowErrors.push(
        `Duplicate question code "${code}" already exists in the question bank.`
      );
    } else if (seenCodesInBatch.has(normalizedCode)) {
      rowErrors.push(
        `Duplicate question code "${code}" appears multiple times in this import batch.`
      );
    }

    const year = Number(yearStr);
    if (Number.isNaN(year) || year < 2015 || year > 2030) {
      rowErrors.push(
        `Invalid exam year "${yearStr}" (must be between 2015 and 2030).`
      );
    }
    if (!VALID_PARTS.includes(part as ExamPart)) {
      rowErrors.push(
        `Invalid part "${part}" (expected "Part A" or "Part B").`
      );
    }
    if (!VALID_TYPES.includes(questionType as QuestionType)) {
      rowErrors.push(
        `Invalid questionType "${questionType}" (expected NAT, MSQ, MCQ, or DRAWING).`
      );
    }
    if (!VALID_DIFFICULTIES.includes(difficulty as DifficultyLevel)) {
      rowErrors.push(
        `Invalid difficulty "${difficulty}" (expected Easy, Medium, or Hard).`
      );
    }
    const maxMarks = Number(maxMarksStr);
    if (Number.isNaN(maxMarks) || maxMarks <= 0) {
      rowErrors.push(`Invalid maxMarks "${maxMarksStr}" (must be > 0).`);
    }
    const negativeMarks = Number(negativeMarksStr);
    if (Number.isNaN(negativeMarks) || negativeMarks < 0) {
      rowErrors.push(
        `Invalid negativeMarks "${negativeMarksStr}" (must be >= 0).`
      );
    }
    if (!statement || statement.length < 10) {
      rowErrors.push(
        'Question statement is missing or shorter than 10 characters.'
      );
    }
    if (!correctAnswerRaw) {
      rowErrors.push('Missing correctAnswer.');
    } else {
      if (questionType === 'NAT' && Number.isNaN(Number(correctAnswerRaw))) {
        rowErrors.push(
          `Invalid NAT correctAnswer "${correctAnswerRaw}" (must be a valid number).`
        );
      }
      if (
        questionType === 'MCQ' &&
        !['A', 'B', 'C', 'D'].includes(correctAnswerRaw.trim().toUpperCase())
      ) {
        rowErrors.push(
          `Invalid MCQ correctAnswer "${correctAnswerRaw}" (expected A, B, C, or D).`
        );
      }
      if (questionType === 'MSQ') {
        const parts = correctAnswerRaw
          .split(/[;|,]/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        if (
          parts.length === 0 ||
          parts.some((p) => !['A', 'B', 'C', 'D'].includes(p))
        ) {
          rowErrors.push(
            `Invalid MSQ correctAnswer "${correctAnswerRaw}" (expected semicolon-separated letters A–D).`
          );
        }
      }
    }

    if (
      (questionType === 'MCQ' || questionType === 'MSQ') &&
      (!optionA || !optionB)
    ) {
      rowErrors.push('MCQ/MSQ questions require at least optionA and optionB.');
    }

    if (rowErrors.length > 0) {
      invalidRows.push({
        rowNumber,
        code: code || `Row-${rowNumber}`,
        errors: rowErrors,
      });
      continue;
    }

    seenCodesInBatch.add(normalizedCode);

    const parsedCorrect =
      questionType === 'MSQ'
        ? correctAnswerRaw
            .split(/[;|,]/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        : correctAnswerRaw.trim();

    const options =
      questionType === 'MCQ' || questionType === 'MSQ'
        ? [
            { id: 'A', text: optionA },
            { id: 'B', text: optionB },
            ...(optionC ? [{ id: 'C', text: optionC }] : []),
            ...(optionD ? [{ id: 'D', text: optionD }] : []),
          ]
        : undefined;

    validQuestions.push({
      id: `imported-${normalizedCode.toLowerCase()}-${i}`,
      code: code.trim(),
      year,
      part: part as ExamPart,
      section:
        part === 'Part B'
          ? 'Part B (Drawing)'
          : `Section (${questionType})`,
      category:
        (category as UCEEDCategory) || 'Visualization and spatial reasoning',
      subtopic: subtopic || 'General Design Aptitude',
      questionType: questionType as QuestionType,
      difficulty: difficulty as DifficultyLevel,
      statement,
      diagramType: 'none',
      options,
      correctAnswer: parsedCorrect,
      markingRule: {
        maxMarks,
        negativeMarks,
        partialMarkingAllowed: questionType === 'MSQ',
        description: `+${maxMarks} for correct, -${negativeMarks} for incorrect`,
      },
      recommendedTimeSeconds: part === 'Part B' ? 1800 : 120,
      sourceClassification: sourceClassification as SourceClassification,
      verificationStatus: 'Imported (Awaiting Verification)',
      isPublished: true,
      explanation: explanation || 'Explanation provided via CSV import.',
      conceptTested: subtopic || category,
      practicalMethod: 'Apply systematic observation and elimination.',
      shortTakeaway: 'Verify constraints before finalizing response.',
      commonMistakeNote: 'Rushing through visual or numerical constraints.',
    });
  }

  return { validQuestions, invalidRows };
}

/**
 * Validates JSON question import data with duplicate checking and schema validation.
 */
export function parseAndValidateQuestionJson(
  jsonText: string,
  existingCodes: Set<string> = new Set()
): {
  validQuestions: Question[];
  invalidRows: CsvValidationIssue[];
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return {
      validQuestions: [],
      invalidRows: [
        {
          rowNumber: 1,
          code: 'JSON_PARSE_ERROR',
          errors: [
            err instanceof Error
              ? `Invalid JSON syntax: ${err.message}`
              : 'Invalid JSON syntax.',
          ],
        },
      ],
    };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return {
      validQuestions: [],
      invalidRows: [
        {
          rowNumber: 1,
          code: 'JSON_ROOT',
          errors: ['JSON root must be a non-empty array of question objects.'],
        },
      ],
    };
  }

  const validQuestions: Question[] = [];
  const invalidRows: CsvValidationIssue[] = [];
  const seenCodes = new Set<string>();

  parsed.forEach((rawItem, idx) => {
    const rowNumber = idx + 1;
    const item = rawItem as Record<string, unknown>;
    const errors: string[] = [];
    const code = typeof item?.code === 'string' ? item.code.trim() : '';
    const normCode = code.toUpperCase();

    if (!normCode) {
      errors.push('Missing "code" field.');
    } else if (existingCodes.has(normCode)) {
      errors.push(`Duplicate code "${code}" already exists in question bank.`);
    } else if (seenCodes.has(normCode)) {
      errors.push(`Duplicate code "${code}" within JSON import payload.`);
    }

    const year = Number(item?.year);
    if (Number.isNaN(year) || year < 2015 || year > 2030) {
      errors.push('Invalid "year" (must be 2015–2030).');
    }

    const part = item?.part as ExamPart;
    if (!VALID_PARTS.includes(part)) {
      errors.push('Invalid "part" (must be "Part A" or "Part B").');
    }

    const questionType = item?.questionType as QuestionType;
    if (!VALID_TYPES.includes(questionType)) {
      errors.push('Invalid "questionType" (must be NAT, MSQ, MCQ, or DRAWING).');
    }

    const difficulty = item?.difficulty as DifficultyLevel;
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      errors.push('Invalid "difficulty" (must be Easy, Medium, or Hard).');
    }

    const maxMarks = Number(item?.maxMarks ?? 4);
    const negativeMarks = Number(item?.negativeMarks ?? 0);
    if (Number.isNaN(maxMarks) || maxMarks <= 0) {
      errors.push('Invalid "maxMarks" (must be > 0).');
    }
    if (Number.isNaN(negativeMarks) || negativeMarks < 0) {
      errors.push('Invalid "negativeMarks" (must be >= 0).');
    }

    const statement =
      typeof item?.statement === 'string' ? item.statement.trim() : '';
    if (statement.length < 10) {
      errors.push('"statement" must be at least 10 characters.');
    }

    if (item?.correctAnswer === undefined || item?.correctAnswer === null || item?.correctAnswer === '') {
      errors.push('Missing "correctAnswer".');
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        code: code || `Item-${rowNumber}`,
        errors,
      });
      return;
    }

    seenCodes.add(normCode);
    validQuestions.push({
      id: `json-${normCode.toLowerCase()}-${rowNumber}`,
      code,
      year,
      part,
      section:
        part === 'Part B'
          ? 'Part B (Drawing)'
          : `Section (${questionType})`,
      category:
        (item.category as UCEEDCategory) ||
        'Visualization and spatial reasoning',
      subtopic:
        typeof item.subtopic === 'string'
          ? item.subtopic
          : 'General Design Aptitude',
      questionType,
      difficulty,
      statement,
      diagramType: 'none',
      options: Array.isArray(item.options)
        ? (item.options as Question['options'])
        : undefined,
      correctAnswer: Array.isArray(item.correctAnswer)
        ? item.correctAnswer.map(String)
        : String(item.correctAnswer),
      markingRule: {
        maxMarks,
        negativeMarks,
        partialMarkingAllowed: questionType === 'MSQ',
        description: `+${maxMarks} for correct, -${negativeMarks} for incorrect`,
      },
      recommendedTimeSeconds: part === 'Part B' ? 1800 : 120,
      sourceClassification:
        'Imported Question (Awaiting Moderator Verification)',
      verificationStatus: 'Imported (Awaiting Verification)',
      isPublished: true,
      explanation:
        typeof item.explanation === 'string'
          ? item.explanation
          : 'Imported via JSON.',
      conceptTested:
        typeof item.subtopic === 'string' ? item.subtopic : 'Design Aptitude',
      practicalMethod: 'Systematic analysis and verification.',
      shortTakeaway: 'Verify all question parameters carefully.',
      commonMistakeNote: 'Rushing through multi-constraint prompts.',
    });
  });

  return { validQuestions, invalidRows };
}
