export type ExamPart = 'Part A' | 'Part B';

export type QuestionType = 'NAT' | 'MSQ' | 'MCQ' | 'DRAWING';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type UCEEDCategory =
  | 'Visualization and spatial reasoning'
  | 'Observation and visual sensitivity'
  | 'Analytical and logical reasoning'
  | 'Environmental and social awareness'
  | 'Language and comprehension'
  | 'Design thinking and problem-solving'
  | 'Basic mathematics and numerical aptitude'
  | 'Pattern recognition'
  | 'Drawing and visual communication';

export type VerificationStatus =
  | 'Verified Official PYQ'
  | 'Imported (Awaiting Verification)'
  | 'Original Practice Question'
  | 'AI-Generated Practice Question';

export type SourceClassification =
  | 'Official UCEED PYQ (IIT Bombay Verified Key)'
  | 'Official UCEED Structure (Verified Pattern)'
  | 'Original Practice Question (UCEED Calibration)'
  | 'Imported Question (Awaiting Moderator Verification)'
  | 'Imported Community Question (Awaiting Moderator Key Check)'
  | 'AI-Generated Targeted Practice'
  | 'AI-Generated Practice Question (Gemini Calibrated)';

export type ErrorCategory =
  | 'Conceptual misunderstanding'
  | 'Incorrect visual observation'
  | 'Faulty logical inference'
  | 'Calculation error'
  | 'Misreading the question'
  | 'Time-management problem'
  | 'Guessing or poor elimination'
  | 'Incomplete answer'
  | 'Drawing or visual communication weakness'
  | 'Needs further practice (insufficient evidence)';

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
  diagnosticIfSelected?: string;
  inferredErrorCategory?: ErrorCategory;
}

export interface MarkingRule {
  maxMarks: number;
  negativeMarks: number;
  partialMarkingAllowed: boolean;
  description: string;
  natTolerance?: number;
}

export interface Question {
  id: string;
  code: string;
  year: number;
  part: ExamPart;
  section: string;
  category: UCEEDCategory;
  subtopic: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  statement: string;
  diagramType?:
    | 'isometric-blocks'
    | 'cube-folding'
    | 'gear-train'
    | 'tessellation-grid'
    | 'perspective-corridor'
    | 'typography-kerning'
    | 'pulley-system'
    | 'orthographic-views'
    | 'paper-punch-symmetry'
    | 'shadow-projection'
    | 'reuleaux-roller'
    | 'part-b-vendor-cart'
    | 'part-b-bus-stop'
    | 'part-b-kitchen-perspective'
    | 'none';
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  markingRule: MarkingRule;
  recommendedTimeSeconds: number;
  sourceClassification: SourceClassification;
  verificationStatus?: VerificationStatus;
  officialSourceUrl?: string;
  isPublished: boolean;
  explanation: string;
  conceptTested: string;
  practicalMethod: string;
  shortTakeaway: string;
  commonMistakeNote: string;
  evaluationCriteria?: {
    criterion: string;
    maxScore: number;
    description: string;
  }[];
  referenceGuidelines?: string[];
}

export interface ExamPaperConfig {
  id: string;
  title: string;
  year: number;
  isOfficialStructure: boolean;
  durationMinutes: number;
  totalMarks: number;
  partAMarks: number;
  partBMarks: number;
  description: string;
  sections: {
    name: string;
    questionType: QuestionType;
    questionCount: number;
    marksPerQuestion: number;
    negativeMarks: number;
    notes: string;
  }[];
  questionIds: string[];
}

export interface AnswerChangeEntry {
  timestamp: number;
  value: string | string[];
}

export interface AttemptResponse {
  questionId: string;
  submittedAnswer: string | string[] | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  answerHistory: AnswerChangeEntry[];
  isRepeatAttempt: boolean;
}

export interface QuestionEvaluationResult {
  questionId: string;
  questionCode: string;
  category: UCEEDCategory;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  part: ExamPart;
  status: 'correct' | 'partial' | 'incorrect' | 'unattempted';
  marksAwarded: number;
  maxMarks: number;
  negativeMarksLost: number;
  submittedAnswer: string | string[] | null;
  verifiedCorrectAnswer: string | string[];
  timeSpentSeconds: number;
  recommendedTimeSeconds: number;
  tookTooLong: boolean;
  changedCorrectToIncorrect: boolean;
  isRepeatAttempt: boolean;
  inferredErrorCategory?: ErrorCategory;
  errorConfidence: 'evidence-backed' | 'hypothesis' | 'none';
  whyAnswerWasWrong: string;
}

export interface TestAttempt {
  id: string;
  examId: string;
  examTitle: string;
  examYear: number;
  mode: 'exam' | 'practice';
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: number;
  totalScore: number;
  maxPossibleScore: number;
  partAScore: number;
  partAMaxScore: number;
  partBScore: number;
  partBMaxScore: number;
  accuracyPercentage: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  negativeMarksLost: number;
  responses: AttemptResponse[];
  evaluations: QuestionEvaluationResult[];
  isDemoData?: boolean;
  syncStatus?: 'synced' | 'pending-offline-sync';
}

export interface PersistedExamSession {
  exam: ExamPaperConfig;
  questionIds: string[];
  questions?: Question[];
  mode: 'exam' | 'practice';
  startedAt: string;
  deadlineTimestamp: number;
  currentIndex: number;
  visitedIds: string[];
  responses: Record<string, AttemptResponse>;
  updatedAt?: number;
}

export interface BookmarkItem {
  questionId: string;
  createdAt: string;
  personalNote: string;
  tag: 'Review Concept' | 'Speed Drill' | 'Tricky Visual' | 'Formula';
}

export interface PartBSubmission {
  id: string;
  questionId: string;
  questionTitle: string;
  submittedAt: string;
  timeTakenMinutes: number;
  imageDataUrl: string;
  selfAssessmentNotes: string;
  selfScores: Record<string, number>;
  aiEvaluation?: {
    estimatedTotalScore: number;
    maxScore: number;
    overallFeedback: string;
    criteriaBreakdown: {
      criterion: string;
      score: number;
      maxScore: number;
      feedback: string;
    }[];
    strengths: string[];
    improvements: string[];
    disclaimer: string;
  };
}

export interface AIAnalysisReport {
  id: string;
  generatedAt: string;
  basedOnAttemptsCount: number;
  performanceSummary: string;
  strengths: {
    topic: string;
    accuracy: number;
    evidence: string;
  }[];
  weaknesses: {
    topic: string;
    issue: string;
    impactMarks: number;
  }[];
  errorClassification: {
    category: ErrorCategory;
    occurrences: number;
    confidence: 'Evidence-Supported' | 'Hypothesis (Needs More Attempts)';
    explanation: string;
  }[];
  personalizedRecommendations: {
    topic: string;
    priority: 'High' | 'Medium';
    whyItMatters: string;
    actionableDrill: string;
  }[];
  improvementPlan: {
    day: number;
    focusTopic: string;
    durationMinutes: number;
    tasks: string[];
  }[];
  scoreImprovementOpportunities: {
    errorType: string;
    hypotheticalMarksGain: number;
    howToRecover: string;
    disclaimer: string;
  }[];
  generatedPracticeQuestions: {
    id: string;
    category: UCEEDCategory;
    questionType: 'NAT' | 'MSQ' | 'MCQ';
    difficulty: DifficultyLevel;
    statement: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    conceptTargeted: string;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  targetExamYear: number;
  dailyStudyGoalMinutes: number;
  streakDays: number;
  isDemoMode: boolean;
}
