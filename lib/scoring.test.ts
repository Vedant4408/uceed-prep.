import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalyticsSummary,
  evaluateQuestionResponse,
  evaluateTestAttempt,
  formatDeterministicDate,
  formatDeterministicDateTime,
  parseAndValidateQuestionCsv,
  parseAndValidateQuestionJson,
} from './scoring';
import { Question } from './types';

const sampleNatQuestion: Question = {
  id: 'q-nat-1',
  code: 'UCEED-2024-NAT-01',
  year: 2024,
  part: 'Part A',
  section: 'Section 1 (NAT)',
  category: 'Visualization and spatial reasoning',
  subtopic: 'Surface Counting',
  questionType: 'NAT',
  difficulty: 'Medium',
  statement: 'How many distinct flat surfaces does the given solid block have?',
  correctAnswer: '14',
  markingRule: {
    maxMarks: 4,
    negativeMarks: 0,
    partialMarkingAllowed: false,
    description: '+4 for correct, 0 for incorrect',
    natTolerance: 0.01,
  },
  recommendedTimeSeconds: 120,
  sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
  verificationStatus: 'Verified Official PYQ',
  isPublished: true,
  explanation: 'Counting top, bottom, and recessed step faces gives 14.',
  conceptTested: '3D Orthographic to Isometric Visualization',
  practicalMethod: 'Count faces by normal vector direction (+X, -X, +Y, -Y, +Z, -Z).',
  shortTakeaway: 'Group parallel faces by axis.',
  commonMistakeNote: 'Forgetting the hidden bottom face or inner vertical step.',
};

const sampleMsqQuestion: Question = {
  id: 'q-msq-1',
  code: 'UCEED-2024-MSQ-01',
  year: 2024,
  part: 'Part A',
  section: 'Section 2 (MSQ)',
  category: 'Analytical and logical reasoning',
  subtopic: 'Symmetry & Folding',
  questionType: 'MSQ',
  difficulty: 'Hard',
  statement: 'Which of the following nets can fold into a closed regular tetrahedron?',
  options: [
    { id: 'A', text: 'Triangular strip of 4 equilateral triangles' },
    { id: 'B', text: 'Central triangle with 3 adjacent triangles' },
    { id: 'C', text: 'Four triangles sharing a single vertex' },
    { id: 'D', text: 'Z-shaped strip of 4 equilateral triangles' },
  ],
  correctAnswer: ['A', 'B', 'D'],
  markingRule: {
    maxMarks: 4,
    negativeMarks: 1,
    partialMarkingAllowed: true,
    description: '+4 all correct, +3/+2/+1 partial, -1 if any wrong chosen',
  },
  recommendedTimeSeconds: 150,
  sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
  verificationStatus: 'Verified Official PYQ',
  isPublished: true,
  explanation: 'Nets A, B, and D fold cleanly; C overlaps two faces.',
  conceptTested: 'Polyhedral Net Folding',
  practicalMethod: 'Fix one base triangle and trace face adjacency.',
  shortTakeaway: 'Three triangles around a single vertex with a fourth attached to the same vertex causes face collision.',
  commonMistakeNote: 'Selecting C without checking vertex degree.',
};

const sampleMcqQuestion: Question = {
  id: 'q-mcq-1',
  code: 'UCEED-2024-MCQ-01',
  year: 2024,
  part: 'Part A',
  section: 'Section 3 (MCQ)',
  category: 'Observation and visual sensitivity',
  subtopic: 'Typography & Kerning',
  questionType: 'MCQ',
  difficulty: 'Easy',
  statement: 'Identify the font classification with hairline serifs and strong vertical stress.',
  options: [
    { id: 'A', text: 'Old Style (Garalde)' },
    { id: 'B', text: 'Didone (Modern)', diagnosticIfSelected: undefined },
    {
      id: 'C',
      text: 'Slab Serif',
      diagnosticIfSelected: 'Slab serifs have thick block-like serifs, not hairline serifs.',
      inferredErrorCategory: 'Conceptual misunderstanding',
    },
    { id: 'D', text: 'Geometric Sans' },
  ],
  correctAnswer: 'B',
  markingRule: {
    maxMarks: 3,
    negativeMarks: 0.71,
    partialMarkingAllowed: false,
    description: '+3 for correct, -0.71 for incorrect',
  },
  recommendedTimeSeconds: 90,
  sourceClassification: 'Official UCEED PYQ (IIT Bombay Verified Key)',
  verificationStatus: 'Verified Official PYQ',
  isPublished: true,
  explanation: 'Didone typefaces (Bodoni, Didot) feature extreme contrast and hairline serifs.',
  conceptTested: 'Vox-ATypI Typeface Classification',
  practicalMethod: 'Check bracketed vs unbracketed hairline serifs and stroke contrast.',
  shortTakeaway: 'Didone = vertical stress + unbracketed hairline serifs.',
  commonMistakeNote: 'Confusing Slab Serif with Didone.',
};

test('Deterministic date formatters produce identical UTC output regardless of timezone', () => {
  assert.equal(formatDeterministicDate('2026-10-22T16:41:00Z'), '22 Oct 2026');
  assert.equal(
    formatDeterministicDateTime('2026-10-22T16:41:00Z'),
    '22 Oct 2026, 16:41 UTC'
  );
});

test('NAT scoring awards +4 on exact match and 0 on wrong answer with off-by-one detection', () => {
  const resCorrect = evaluateQuestionResponse(sampleNatQuestion, {
    questionId: 'q-nat-1',
    submittedAnswer: '14',
    isMarkedForReview: false,
    timeSpentSeconds: 95,
    answerHistory: [{ timestamp: 1, value: '14' }],
    isRepeatAttempt: false,
  });
  assert.equal(resCorrect.status, 'correct');
  assert.equal(resCorrect.marksAwarded, 4);

  const resWrong = evaluateQuestionResponse(sampleNatQuestion, {
    questionId: 'q-nat-1',
    submittedAnswer: '13',
    isMarkedForReview: false,
    timeSpentSeconds: 160,
    answerHistory: [
      { timestamp: 1, value: '14' },
      { timestamp: 2, value: '13' },
    ],
    isRepeatAttempt: false,
  });
  assert.equal(resWrong.status, 'incorrect');
  assert.equal(resWrong.marksAwarded, 0);
  assert.equal(resWrong.changedCorrectToIncorrect, true);
  assert.equal(resWrong.tookTooLong, true);
  assert.equal(resWrong.inferredErrorCategory, 'Calculation error');
});

test('MSQ partial marking awards +4 for all, +2 for 2 of 3, and -1 if any wrong option is chosen', () => {
  const full = evaluateQuestionResponse(sampleMsqQuestion, {
    questionId: 'q-msq-1',
    submittedAnswer: ['A', 'B', 'D'],
    isMarkedForReview: false,
    timeSpentSeconds: 100,
    answerHistory: [],
    isRepeatAttempt: false,
  });
  assert.equal(full.status, 'correct');
  assert.equal(full.marksAwarded, 4);

  const partialTwo = evaluateQuestionResponse(sampleMsqQuestion, {
    questionId: 'q-msq-1',
    submittedAnswer: ['A', 'B'],
    isMarkedForReview: false,
    timeSpentSeconds: 100,
    answerHistory: [],
    isRepeatAttempt: false,
  });
  assert.equal(partialTwo.status, 'partial');
  assert.equal(partialTwo.marksAwarded, 2);

  const wrongOne = evaluateQuestionResponse(sampleMsqQuestion, {
    questionId: 'q-msq-1',
    submittedAnswer: ['A', 'B', 'C'],
    isMarkedForReview: false,
    timeSpentSeconds: 100,
    answerHistory: [],
    isRepeatAttempt: false,
  });
  assert.equal(wrongOne.status, 'incorrect');
  assert.equal(wrongOne.marksAwarded, -1);
  assert.equal(wrongOne.negativeMarksLost, 1);
});

test('MCQ scoring deducts -0.71 and separates unseen vs repeated analytics', () => {
  const attempt = evaluateTestAttempt({
    id: 'att-1',
    examId: 'exam-2024',
    examTitle: 'UCEED 2024 Diagnostic',
    examYear: 2024,
    mode: 'exam',
    startedAt: '2026-10-24T08:00:00Z',
    completedAt: '2026-10-24T08:10:00Z',
    questions: [sampleNatQuestion, sampleMcqQuestion],
    responses: [
      {
        questionId: 'q-nat-1',
        submittedAnswer: '14',
        isMarkedForReview: false,
        timeSpentSeconds: 80,
        answerHistory: [],
        isRepeatAttempt: true,
      },
      {
        questionId: 'q-mcq-1',
        submittedAnswer: 'C',
        isMarkedForReview: false,
        timeSpentSeconds: 60,
        answerHistory: [],
        isRepeatAttempt: false,
      },
    ],
  });

  assert.equal(attempt.totalScore, 3.29);
  assert.equal(attempt.negativeMarksLost, 0.71);

  const analytics = computeAnalyticsSummary([attempt]);
  assert.equal(analytics.repeatedAttempted, 1);
  assert.equal(analytics.repeatedAccuracy, 100);
  assert.equal(analytics.unseenAttempted, 1);
  assert.equal(analytics.unseenAccuracy, 0);
});

test('CSV and JSON validators reject duplicate codes and invalid answers', () => {
  const existing = new Set(['EXISTING-CODE-01']);
  const csv = [
    'code,year,part,questionType,category,subtopic,difficulty,maxMarks,negativeMarks,statement,optionA,optionB,optionC,optionD,correctAnswer,explanation,sourceClassification',
    'UCEED-2025-NAT-99,2025,Part A,NAT,Visualization and spatial reasoning,Folding,Medium,4,0,How many vertices are formed after folding the given polygon?, , , , ,12,Twelve vertices remain distinct.,Official UCEED Structure (Verified Pattern)',
    'EXISTING-CODE-01,2024,Part A,NAT,Visualization and spatial reasoning,Folding,Medium,4,0,Duplicate code against bank should fail validation., , , , ,10,Duplicate.,Original Practice Question (UCEED Calibration)',
    'BAD-NAT-ANS,2024,Part A,NAT,Visualization and spatial reasoning,Folding,Medium,4,0,Non-numeric NAT answer should fail validation., , , , ,NOT_A_NUM,Invalid.,Original Practice Question (UCEED Calibration)',
  ].join('\n');

  const csvResult = parseAndValidateQuestionCsv(csv, existing);
  assert.equal(csvResult.validQuestions.length, 1);
  assert.equal(csvResult.invalidRows.length, 2);

  const jsonPayload = JSON.stringify([
    {
      code: 'JSON-Q-01',
      year: 2024,
      part: 'Part A',
      questionType: 'NAT',
      difficulty: 'Easy',
      maxMarks: 4,
      negativeMarks: 0,
      statement: 'How many edges does a regular octahedron possess?',
      correctAnswer: '12',
    },
    {
      code: 'JSON-Q-01', // Duplicate within batch
      year: 2024,
      part: 'Part A',
      questionType: 'NAT',
      difficulty: 'Easy',
      maxMarks: 4,
      negativeMarks: 0,
      statement: 'Duplicate code inside JSON batch must be rejected.',
      correctAnswer: '12',
    },
  ]);

  const jsonResult = parseAndValidateQuestionJson(jsonPayload, existing);
  assert.equal(jsonResult.validQuestions.length, 1);
  assert.equal(jsonResult.invalidRows.length, 1);
});
