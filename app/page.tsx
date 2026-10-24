'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  LayoutDashboard,
  Menu,
  Palette,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  BookmarkItem,
  DifficultyLevel,
  ExamPaperConfig,
  ExamPart,
  PartBSubmission,
  PersistedExamSession,
  Question,
  QuestionType,
  TestAttempt,
  UserProfile,
  VerificationStatus,
} from '@/lib/types';
import {
  createInitialDemoAttempts,
  EXAM_PAPERS,
  INITIAL_DEMO_BOOKMARKS,
  INITIAL_DEMO_PART_B_SUBMISSIONS,
  INITIAL_QUESTIONS,
  UCEED_CATEGORIES,
} from '@/lib/questions-data';
import {
  computeAnalyticsSummary,
  formatDeterministicDate,
  getQuestionVerificationStatus,
} from '@/lib/scoring';
import { isSupabaseConfigured } from '@/lib/supabase';
import { QuestionDiagram } from '@/components/QuestionDiagram';
import {
  ACTIVE_EXAM_STORAGE_KEY,
  ExamInterface,
} from '@/components/ExamInterface';
import { TestResultView } from '@/components/TestResultView';
import { PartBStudioView } from '@/components/PartBStudioView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { AIStudyCoachView } from '@/components/AIStudyCoachView';
import { ProfileSettingsView } from '@/components/ProfileSettingsView';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ThemeToggleButton } from '@/components/ThemeProvider';

type NavTab =
  | 'dashboard'
  | 'practice'
  | 'pyq-papers'
  | 'mock-tests'
  | 'part-b-studio'
  | 'analytics'
  | 'ai-coach'
  | 'bookmarks'
  | 'settings';

export default function UCEEDPrepLabApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Core Application State
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [attempts, setAttempts] = useState<TestAttempt[]>(() =>
    createInitialDemoAttempts(INITIAL_QUESTIONS)
  );
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(
    INITIAL_DEMO_BOOKMARKS
  );
  const [partBSubmissions, setPartBSubmissions] = useState<PartBSubmission[]>(
    INITIAL_DEMO_PART_B_SUBMISSIONS
  );
  const [profile, setProfile] = useState<UserProfile>({
    id: 'demo-student-01',
    name: 'Aarav Mehta (Demo Student)',
    email: 'aarav.mehta@uceed-prep.demo',
    role: 'admin',
    targetExamYear: 2026,
    dailyStudyGoalMinutes: 90,
    streakDays: 6,
    isDemoMode: !isSupabaseConfigured,
  });

  // Active Exam / Result View State
  const [activeExamSession, setActiveExamSession] = useState<{
    exam: ExamPaperConfig;
    questions: Question[];
    mode: 'exam' | 'practice';
    restoredSession?: PersistedExamSession | null;
  } | null>(null);

  const [viewingResultAttempt, setViewingResultAttempt] =
    useState<TestAttempt | null>(null);

  // Question Bank Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterPart, setFilterPart] = useState<'all' | ExamPart>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | QuestionType>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<
    'all' | DifficultyLevel
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'attempted' | 'unattempted' | 'incorrect' | 'bookmarked'
  >('all');
  const [filterVerification, setFilterVerification] = useState<
    'all' | VerificationStatus
  >('all');

  // Inline Question Bank Instant Practice State
  const [inlineResponses, setInlineResponses] = useState<
    Record<string, string | string[]>
  >({});
  const [inlineRevealedIds, setInlineRevealedIds] = useState<Set<string>>(
    new Set()
  );

  // Hydrate saved state & active exam session from localStorage on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedQuestions = localStorage.getItem('uceed_prep_questions_v1');
        let currentQuestions = INITIAL_QUESTIONS;
        if (savedQuestions) {
          const parsedQs = JSON.parse(savedQuestions);
          if (
            Array.isArray(parsedQs) &&
            parsedQs.length >= INITIAL_QUESTIONS.length
          ) {
            currentQuestions = parsedQs;
            setQuestions(parsedQs);
          }
        }

        const savedAttempts = localStorage.getItem('uceed_prep_attempts_v1');
        if (savedAttempts) {
          const parsed = JSON.parse(savedAttempts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAttempts(parsed);
          }
        }
        const savedBookmarks = localStorage.getItem('uceed_prep_bookmarks_v1');
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }

        // Restore active in-progress exam session across page refresh
        const savedActiveExam = localStorage.getItem(ACTIVE_EXAM_STORAGE_KEY);
        if (savedActiveExam) {
          const parsedSession: PersistedExamSession =
            JSON.parse(savedActiveExam);
          if (
            parsedSession &&
            parsedSession.exam &&
            Array.isArray(parsedSession.questionIds) &&
            parsedSession.deadlineTimestamp > Date.now() - 3600000
          ) {
            const qMap = new Map(currentQuestions.map((q) => [q.id, q]));
            const restoredQs = parsedSession.questionIds
              .map((id) => qMap.get(id))
              .filter((q): q is Question => Boolean(q));
            if (restoredQs.length > 0) {
              setActiveExamSession({
                exam: parsedSession.exam,
                questions: restoredQs,
                mode: parsedSession.mode,
                restoredSession: parsedSession,
              });
            }
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('uceed_prep_attempts_v1', JSON.stringify(attempts));
    } catch {
      // Ignore
    }
  }, [attempts]);

  useEffect(() => {
    try {
      localStorage.setItem('uceed_prep_questions_v1', JSON.stringify(questions));
    } catch {
      // Ignore
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'uceed_prep_bookmarks_v1',
        JSON.stringify(bookmarks)
      );
    } catch {
      // Ignore
    }
  }, [bookmarks]);

  // Derived Sets for Attempted / Incorrect / Bookmarked questions
  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.questionId)),
    [bookmarks]
  );

  const questionStatusMap = useMemo(() => {
    const map = new Map<
      string,
      'correct' | 'partial' | 'incorrect' | 'unattempted'
    >();
    for (const att of [...attempts].reverse()) {
      for (const ev of att.evaluations) {
        if (ev.status !== 'unattempted') {
          map.set(ev.questionId, ev.status);
        }
      }
    }
    return map;
  }, [attempts]);

  const previouslyAttemptedQuestionIds = useMemo(
    () => new Set(questionStatusMap.keys()),
    [questionStatusMap]
  );

  const incorrectQuestionsList = useMemo(
    () =>
      questions.filter(
        (q) => q.isPublished && questionStatusMap.get(q.id) === 'incorrect'
      ),
    [questions, questionStatusMap]
  );

  // Accurate Verification Counts (Never claim generated/imported questions are official)
  const verificationCounts = useMemo(() => {
    const published = questions.filter((q) => q.isPublished);
    let verifiedOfficial = 0;
    let originalPractice = 0;
    let importedPending = 0;
    let aiGenerated = 0;
    for (const q of published) {
      const status = getQuestionVerificationStatus(q);
      if (status === 'Verified Official PYQ') verifiedOfficial += 1;
      else if (status === 'Original Practice Question') originalPractice += 1;
      else if (status === 'Imported (Awaiting Verification)')
        importedPending += 1;
      else if (status === 'AI-Generated Practice Question') aiGenerated += 1;
    }
    return {
      total: published.length,
      verifiedOfficial,
      originalPractice,
      importedPending,
      aiGenerated,
    };
  }, [questions]);

  // Dashboard Metrics Calculation
  const dashboardStats = useMemo(() => {
    const allEvals = attempts.flatMap((a) => a.evaluations);
    const attemptedEvals = allEvals.filter((e) => e.status !== 'unattempted');
    const correctCount = attemptedEvals.filter(
      (e) => e.status === 'correct'
    ).length;
    const partialCount = attemptedEvals.filter(
      (e) => e.status === 'partial'
    ).length;
    const incorrectCount = attemptedEvals.filter(
      (e) => e.status === 'incorrect'
    ).length;
    const overallAccuracy =
      attemptedEvals.length > 0
        ? Number(
            (
              ((correctCount + partialCount * 0.5) / attemptedEvals.length) *
              100
            ).toFixed(1)
          )
        : 0;

    const totalPracticeSeconds = attempts.reduce(
      (acc, a) => acc + a.totalDurationSeconds,
      0
    );
    const partATotalEarned = attempts.reduce((s, a) => s + a.partAScore, 0);
    const partATotalMax = attempts.reduce((s, a) => s + a.partAMaxScore, 0);

    const analytics = computeAnalyticsSummary(attempts);
    const sortedTopics = [...analytics.topicBreakdown].sort(
      (a, b) => b.accuracy - a.accuracy
    );
    const strongestTopic = sortedTopics[0];
    const weakestTopic = sortedTopics[sortedTopics.length - 1];

    const partBAvgScore =
      partBSubmissions.length > 0
        ? Math.round(
            partBSubmissions.reduce(
              (s, sub) => s + (sub.aiEvaluation?.estimatedTotalScore || 36),
              0
            ) / partBSubmissions.length
          )
        : 0;

    return {
      totalAttempted: attemptedEvals.length,
      correctCount,
      partialCount,
      incorrectCount,
      overallAccuracy,
      totalPracticeMinutes: Math.max(
        25,
        Math.round(totalPracticeSeconds / 60) +
          partBSubmissions.reduce((s, p) => s + p.timeTakenMinutes, 0)
      ),
      partAPct:
        partATotalMax > 0
          ? Math.round((partATotalEarned / partATotalMax) * 100)
          : 0,
      partBAvgScore,
      strongestTopic,
      weakestTopic,
    };
  }, [attempts, partBSubmissions]);

  // Filtered Question Bank List
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q.isPublished) return false;
      if (filterYear !== 'all' && String(q.year) !== filterYear) return false;
      if (filterPart !== 'all' && q.part !== filterPart) return false;
      if (filterCategory !== 'all' && q.category !== filterCategory)
        return false;
      if (filterType !== 'all' && q.questionType !== filterType) return false;
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty)
        return false;

      if (filterVerification !== 'all') {
        const vStatus = getQuestionVerificationStatus(q);
        if (vStatus !== filterVerification) return false;
      }

      const status = questionStatusMap.get(q.id);
      if (filterStatus === 'attempted' && !status) return false;
      if (filterStatus === 'unattempted' && status) return false;
      if (filterStatus === 'incorrect' && status !== 'incorrect') return false;
      if (filterStatus === 'bookmarked' && !bookmarkedIds.has(q.id))
        return false;

      if (searchQuery.trim() !== '') {
        const needle = searchQuery.toLowerCase();
        const hay =
          `${q.code} ${q.statement} ${q.category} ${q.subtopic}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [
    questions,
    filterYear,
    filterPart,
    filterCategory,
    filterType,
    filterDifficulty,
    filterVerification,
    filterStatus,
    searchQuery,
    questionStatusMap,
    bookmarkedIds,
  ]);

  const handleToggleBookmark = (questionId: string, note?: string) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.questionId === questionId);
      if (exists) {
        return prev.filter((b) => b.questionId !== questionId);
      }
      return [
        {
          questionId,
          createdAt: new Date().toISOString(),
          personalNote:
            note ||
            'Bookmarked for pre-exam concept and speed verification.',
          tag: 'Review Concept',
        },
        ...prev,
      ];
    });
  };

  const launchExamPaper = (
    paper: ExamPaperConfig,
    mode: 'exam' | 'practice'
  ) => {
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const paperQuestions = paper.questionIds
      .map((id) => qMap.get(id))
      .filter((q): q is Question => Boolean(q));

    setViewingResultAttempt(null);
    setActiveExamSession({
      exam: paper,
      questions: paperQuestions.length > 0 ? paperQuestions : questions,
      mode,
      restoredSession: null,
    });
  };

  const launchCustomPracticeSet = (
    customQuestions: Question[],
    title: string,
    mode: 'exam' | 'practice' = 'practice'
  ) => {
    if (customQuestions.length === 0) return;
    const customExam: ExamPaperConfig = {
      id: `custom-${Date.now()}`,
      title,
      year: 2025,
      isOfficialStructure: false,
      durationMinutes: Math.max(10, customQuestions.length * 3),
      totalMarks: customQuestions.reduce(
        (s, q) => s + q.markingRule.maxMarks,
        0
      ),
      partAMarks: customQuestions
        .filter((q) => q.part === 'Part A')
        .reduce((s, q) => s + q.markingRule.maxMarks, 0),
      partBMarks: customQuestions
        .filter((q) => q.part === 'Part B')
        .reduce((s, q) => s + q.markingRule.maxMarks, 0),
      description: 'Targeted practice session calibrated to UCEED marking rules.',
      sections: [
        {
          name: 'Mixed UCEED Practice',
          questionType: 'NAT',
          questionCount: customQuestions.length,
          marksPerQuestion: 4,
          negativeMarks: 0,
          notes: 'Evaluated per individual question marking rule.',
        },
      ],
      questionIds: customQuestions.map((q) => q.id),
    };

    setViewingResultAttempt(null);
    setActiveExamSession({
      exam: customExam,
      questions: customQuestions,
      mode,
      restoredSession: null,
    });
  };

  // If an exam session is currently active, render the distraction-free ExamInterface
  if (activeExamSession) {
    return (
      <ExamInterface
        exam={activeExamSession.exam}
        questions={activeExamSession.questions}
        mode={activeExamSession.mode}
        previouslyAttemptedQuestionIds={previouslyAttemptedQuestionIds}
        bookmarkedIds={bookmarkedIds}
        restoredSession={activeExamSession.restoredSession}
        onToggleBookmark={handleToggleBookmark}
        onCompleteAttempt={(completedAttempt) => {
          setAttempts((prev) => [completedAttempt, ...prev]);
          setActiveExamSession(null);
          setViewingResultAttempt(completedAttempt);
        }}
        onExit={() => setActiveExamSession(null)}
      />
    );
  }

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', label: 'Practice Questions', icon: BookOpen },
    { id: 'pyq-papers', label: 'Previous-Year Papers', icon: FileText },
    { id: 'mock-tests', label: 'Mock Tests', icon: ClipboardCheck },
    { id: 'part-b-studio', label: 'Part B Studio', icon: Palette },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'ai-coach', label: 'AI Study Coach', icon: Sparkles },
    { id: 'bookmarks', label: 'Bookmarks', icon: BookMarked },
    { id: 'settings', label: 'Profile and Settings', icon: Settings },
  ];

  // 5 Primary Mobile Bottom Bar Items
  const mobileBottomTabs: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'mock-tests', label: 'Mock Tests', icon: ClipboardCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Profile', icon: User },
  ];

  const unsyncedCount = attempts.filter((a) => !a.isDemoData).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 pb-20 lg:pb-0">
      {/* Top Bar Contract (3-Zone Header) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-6 border-b border-slate-200 bg-white px-3 sm:px-6 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            data-testid="mobile-nav-more"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
          >
            {mobileNavOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('dashboard');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            UCEED Prep Lab
          </button>
        </div>

        {/* Zone 2: Concise Top Quick Links */}
        <nav
          aria-label="Primary quick navigation"
          className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('dashboard');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard' && !viewingResultAttempt
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-sky-700'
                : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('practice');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'practice' && !viewingResultAttempt
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-sky-700'
                : ''
            }`}
          >
            Question Bank
          </button>
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('mock-tests');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'mock-tests' && !viewingResultAttempt
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-sky-700'
                : ''
            }`}
          >
            Mock Tests
          </button>
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('part-b-studio');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'part-b-studio' && !viewingResultAttempt
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-sky-700'
                : ''
            }`}
          >
            Part B Studio
          </button>
          <button
            type="button"
            onClick={() => {
              setViewingResultAttempt(null);
              setActiveTab('ai-coach');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ai-coach' && !viewingResultAttempt
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-sky-700'
                : ''
            }`}
          >
            AI Study Coach
          </button>
        </nav>

        {/* Zone 3: Theme Toggle, PWA Status & Primary Action CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggleButton testId="header-theme-toggle" />
          <PWAInstallPrompt unsyncedCount={unsyncedCount} />
          <button
            type="button"
            onClick={() => launchExamPaper(EXAM_PAPERS[1] || EXAM_PAPERS[0], 'practice')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Continue Practicing</span>
            <span className="xs:hidden">Practice</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay for All 9 Navigation Destinations */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-900">
                All Prep Modules
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id && !viewingResultAttempt;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setViewingResultAttempt(null);
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <ThemeToggleButton
                showLabel
                testId="drawer-theme-toggle"
                className="w-full justify-start px-3.5 py-2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Workspace Body: Left Sidebar (Desktop) + Main Content Viewport */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        {/* Desktop Sidebar Navigation */}
        <aside
          aria-label="Full workspace navigation"
          className="hidden lg:block w-64 shrink-0 border-r border-slate-200 bg-white p-4"
        >
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id && !viewingResultAttempt;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setViewingResultAttempt(null);
                    setActiveTab(item.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Question Bank Verification Breakdown Card */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>Repository Audit</span>
              <span className="font-mono text-sky-700">
                {verificationCounts.total} Qs
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Verified Official PYQs:</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {verificationCounts.verifiedOfficial}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Original Calibrated:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {verificationCounts.originalPractice}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Imported (Pending Key):</span>
                <span className="font-mono font-semibold text-amber-700">
                  {verificationCounts.importedPending}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AI-Generated Practice:</span>
                <span className="font-mono font-semibold text-purple-700">
                  {verificationCounts.aiGenerated}
                </span>
              </div>
            </div>
          </div>

          {/* Data Mode Disclosure Panel */}
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-900">
              {profile.isDemoMode
                ? 'Demo Mode Active'
                : 'Supabase Account Active'}
            </div>
            <p className="text-[11px] leading-relaxed">
              {profile.isDemoMode
                ? 'Displaying clearly labeled sample diagnostic data + local browser persistence. Connect Supabase in Settings for cloud sync.'
                : 'Connected to your personal Supabase database with RLS protection.'}
            </p>
            <div className="pt-1 font-mono text-[11px] text-slate-800 tabular-nums">
              Target: UCEED {profile.targetExamYear} · Goal:{' '}
              {profile.dailyStudyGoalMinutes}m/day
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8">
          {/* If viewing a completed test evaluation result, show TestResultView */}
          {viewingResultAttempt ? (
            <TestResultView
              attempt={viewingResultAttempt}
              questions={questions}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onOpenAICoach={() => {
                setViewingResultAttempt(null);
                setActiveTab('ai-coach');
              }}
              onBackToDashboard={() => setViewingResultAttempt(null)}
            />
          ) : (
            <>
              {/* 1. DASHBOARD VIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Hero / Welcome Banner with Demo Data Distinction */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                      <div className="max-w-2xl space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>IIT Bombay UCEED Entrance Preparation</span>
                          <span aria-hidden="true">·</span>
                          <span>Target Year: {profile.targetExamYear}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-amber-800">
                            {attempts.some((a) => a.isDemoData)
                              ? 'Includes Sample Demo Data (Take a test to record personal data)'
                              : 'Personal Account Data'}
                          </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                          Welcome back, {profile.name.split(' ')[0]}. Ready for
                          your next UCEED calibration session?
                        </h1>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                          Practice {verificationCounts.verifiedOfficial} verified
                          official IIT Bombay UCEED PYQs (2020–2025) alongside
                          calibrated NAT, MSQ, MCQ, and Part B drawing problems.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            launchExamPaper(EXAM_PAPERS[0], 'practice')
                          }
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-700 px-4 sm:px-5 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Play className="h-4 w-4" />
                          Continue Practicing (UCEED 2025 Set)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('mock-tests')}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          Take Timed Mock Test
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Primary KPI Grid (All 11 Required Dashboard Metrics) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Questions Attempted
                      </div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                        {dashboardStats.totalAttempted}
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        Across {attempts.length} sessions
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Overall Accuracy
                      </div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-sky-700 tabular-nums">
                        {dashboardStats.overallAccuracy}%
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        {dashboardStats.correctCount} correct ·{' '}
                        {dashboardStats.incorrectCount} wrong
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Part A Performance
                      </div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                        {dashboardStats.partAPct}%
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        NAT + MSQ + MCQ score ratio
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Part B Studio Avg
                      </div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
                        ~{dashboardStats.partBAvgScore}
                        <span className="text-sm font-normal text-slate-400">
                          /50
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        {partBSubmissions.length} drawing submission(s)
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Practice Streak
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
                        <Flame className="h-5 w-5" />
                        {profile.streakDays}d
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        Daily goal: {profile.dailyStudyGoalMinutes}m
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
                      <div className="text-xs text-slate-500">
                        Total Practice Time
                      </div>
                      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                        {dashboardStats.totalPracticeMinutes}m
                      </div>
                      <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                        Timed Part A & Part B
                      </div>
                    </div>
                  </div>

                  {/* Strongest / Weakest Topics & Recommended Next Session */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Strongest Topic</span>
                        <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                          {dashboardStats.strongestTopic?.accuracy ?? 100}%
                          Accuracy
                        </span>
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {dashboardStats.strongestTopic?.topic ||
                          'Observation and visual sensitivity'}
                      </div>
                      <p className="text-xs text-slate-600">
                        Consistent first-attempt accuracy with zero negative
                        marking deductions. Maintain speed with weekly mixed
                        drills.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Priority Weakest Topic</span>
                        <span className="font-mono font-semibold text-red-600 tabular-nums">
                          {dashboardStats.weakestTopic?.accuracy ?? 0}% Accuracy
                        </span>
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {dashboardStats.weakestTopic?.topic ||
                          'Pattern recognition'}
                      </div>
                      <p className="text-xs text-slate-600">
                        Demonstrated distractor errors in perspective depth
                        spacing and pulley strand counting. High mark-recovery
                        potential.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                          <Compass className="h-4 w-4" />
                          Recommended Next Practice Session
                        </div>
                        <div className="mt-1 text-base font-bold text-slate-900">
                          Spatial & Mechanical Reasoning Drill
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Targeted session focusing on 3D surface counting
                          (NAT), cube nets (MSQ), and pulley equilibrium (MCQ).
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            launchCustomPracticeSet(
                              questions.filter(
                                (q) =>
                                  q.category ===
                                    'Visualization and spatial reasoning' ||
                                  q.category ===
                                    'Analytical and logical reasoning'
                              ),
                              'Recommended Drill: Spatial & Mechanical Reasoning'
                            )
                          }
                          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Start Topic Drill
                        </button>
                        {incorrectQuestionsList.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              launchCustomPracticeSet(
                                incorrectQuestionsList,
                                'Incorrect-Question Recovery Session',
                                'practice'
                              )
                            }
                            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retry {incorrectQuestionsList.length} Wrong
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Test Results & Quick Workspace Cards */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Recent Test Results
                          </h2>
                          <p className="text-xs text-slate-500">
                            Tap any test session to open the full 8-point
                            question evaluation and answer review.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('analytics')}
                          className="text-xs font-semibold text-sky-700 hover:underline"
                        >
                          View Full Analytics →
                        </button>
                      </div>

                      <div className="mt-4 divide-y divide-slate-100">
                        {attempts.map((att) => (
                          <div
                            key={att.id}
                            className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {att.examTitle}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {formatDeterministicDate(att.completedAt)} ·{' '}
                                {att.correctCount} correct · {att.partialCount}{' '}
                                partial · {att.incorrectCount} wrong ·{' '}
                                {att.isDemoData
                                  ? 'Labeled Sample Data'
                                  : 'Saved Account Attempt'}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="text-right font-mono">
                                <div className="text-sm font-bold text-slate-900 tabular-nums">
                                  {att.totalScore} / {att.maxPossibleScore}
                                </div>
                                <div className="text-xs text-sky-700 tabular-nums">
                                  {att.accuracyPercentage}% accuracy
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewingResultAttempt(att)}
                                className="min-h-[38px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Review Answers
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Module Launchpad */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3">
                      <h2 className="text-base font-bold text-slate-900">
                        Quick Access Modules
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('practice')}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left text-xs hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            UCEED Question Bank (2020–2025)
                          </div>
                          <div className="text-slate-500">
                            {verificationCounts.verifiedOfficial} Verified PYQs
                            + Practice Sets
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-sky-700">
                          {verificationCounts.total} Qs →
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('pyq-papers')}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left text-xs hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Previous-Year Exam Structures
                          </div>
                          <div className="text-slate-500">
                            2024–2025 vs 2020–2023 official marking
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-sky-700">
                          Open →
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('part-b-studio')}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left text-xs hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Part B Drawing Studio
                          </div>
                          <div className="text-slate-500">
                            Touch sketchpad, camera upload & AI rubric
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-sky-700">
                          50M →
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('ai-coach')}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left text-xs hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Gemini AI Study Coach
                          </div>
                          <div className="text-slate-500">
                            Error classification & 7-day study plan
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-sky-700">
                          Analyze →
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PRACTICE QUESTIONS (SEARCHABLE & FILTERABLE QUESTION BANK) */}
              {activeTab === 'practice' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        UCEED Question Bank & Topic Explorer (2020–2025)
                      </h1>
                      <p className="mt-1 text-xs text-slate-500">
                        Separates Verified Official IIT Bombay PYQs from
                        Original Practice, Imported, and AI-Generated items.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {incorrectQuestionsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            launchCustomPracticeSet(
                              incorrectQuestionsList,
                              `Incorrect Questions Review (${incorrectQuestionsList.length} Qs)`,
                              'practice'
                            )
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Review Incorrect ({incorrectQuestionsList.length})
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={filteredQuestions.length === 0}
                        onClick={() =>
                          launchCustomPracticeSet(
                            filteredQuestions,
                            `Filtered Practice Set (${filteredQuestions.length} Questions)`,
                            'practice'
                          )
                        }
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Practice Filtered Set ({filteredQuestions.length})
                      </button>
                    </div>
                  </div>

                  {/* Verification Source Transparency Strip */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFilterVerification(
                          filterVerification === 'Verified Official PYQ'
                            ? 'all'
                            : 'Verified Official PYQ'
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        filterVerification === 'Verified Official PYQ'
                          ? 'border-emerald-600 bg-emerald-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-slate-500">
                        Verified Official PYQs
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                        {verificationCounts.verifiedOfficial}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        IIT Bombay Key (2020–2025)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilterVerification(
                          filterVerification === 'Original Practice Question'
                            ? 'all'
                            : 'Original Practice Question'
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        filterVerification === 'Original Practice Question'
                          ? 'border-sky-600 bg-sky-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-slate-500">
                        Original Practice Qs
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-sky-700 tabular-nums">
                        {verificationCounts.originalPractice}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Calibrated Mock Problems
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilterVerification(
                          filterVerification ===
                            'Imported (Awaiting Verification)'
                            ? 'all'
                            : 'Imported (Awaiting Verification)'
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        filterVerification ===
                        'Imported (Awaiting Verification)'
                          ? 'border-amber-500 bg-amber-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-slate-500">
                        Imported (Unverified)
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-amber-700 tabular-nums">
                        {verificationCounts.importedPending}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Awaiting Moderator Key Check
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFilterVerification(
                          filterVerification ===
                            'AI-Generated Practice Question'
                            ? 'all'
                            : 'AI-Generated Practice Question'
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        filterVerification === 'AI-Generated Practice Question'
                          ? 'border-purple-600 bg-purple-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-slate-500">
                        AI-Generated Practice
                      </div>
                      <div className="mt-0.5 font-mono text-lg font-bold text-purple-700 tabular-nums">
                        {verificationCounts.aiGenerated}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Clearly Labeled Synthetic
                      </div>
                    </button>
                  </div>

                  {/* Multi-Dimensional Filter Controls */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <div className="sm:col-span-2 relative">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search code, Reuleaux, Patola, Bauhaus, pulley, gear..."
                          aria-label="Search questions"
                          className="min-h-[38px] w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
                        />
                      </div>

                      <select
                        aria-label="Filter by Exam Year"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                      >
                        <option value="all">All Exam Years (2020–2025)</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                      </select>

                      <select
                        aria-label="Filter by Part"
                        value={filterPart}
                        onChange={(e) =>
                          setFilterPart(e.target.value as 'all' | ExamPart)
                        }
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                      >
                        <option value="all">Part A & Part B</option>
                        <option value="Part A">Part A (Computer Based)</option>
                        <option value="Part B">Part B (Drawing/Design)</option>
                      </select>

                      <select
                        aria-label="Filter by Question Type"
                        value={filterType}
                        onChange={(e) =>
                          setFilterType(e.target.value as 'all' | QuestionType)
                        }
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                      >
                        <option value="all">All Types (NAT/MSQ/MCQ/Draw)</option>
                        <option value="NAT">NAT (Numerical Answer)</option>
                        <option value="MSQ">MSQ (Multiple Select)</option>
                        <option value="MCQ">MCQ (Multiple Choice)</option>
                        <option value="DRAWING">DRAWING (Part B)</option>
                      </select>

                      <select
                        aria-label="Filter by Difficulty"
                        value={filterDifficulty}
                        onChange={(e) =>
                          setFilterDifficulty(
                            e.target.value as 'all' | DifficultyLevel
                          )
                        }
                        className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          aria-label="Filter by Category"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="min-h-[36px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        >
                          <option value="all">All 9 UCEED Categories</option>
                          {UCEED_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Attempt Status Segmented Control */}
                      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
                        {(
                          [
                            { id: 'all', label: 'All' },
                            { id: 'unattempted', label: 'Unattempted' },
                            { id: 'attempted', label: 'Attempted' },
                            { id: 'incorrect', label: 'Incorrect' },
                            { id: 'bookmarked', label: 'Bookmarked' },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setFilterStatus(st.id)}
                            className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                              filterStatus === st.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  {filteredQuestions.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-900">
                        No questions match the current filters.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterYear('all');
                          setFilterPart('all');
                          setFilterCategory('all');
                          setFilterType('all');
                          setFilterDifficulty('all');
                          setFilterStatus('all');
                          setFilterVerification('all');
                        }}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((q) => {
                        const prevStatus = questionStatusMap.get(q.id);
                        const inlineAns = inlineResponses[q.id];
                        const isRevealed = inlineRevealedIds.has(q.id);
                        const vStatus = getQuestionVerificationStatus(q);

                        return (
                          <div
                            key={q.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4"
                          >
                            {/* Clean unboxed metadata row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">
                                  {q.code}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{q.year}</span>
                                <span aria-hidden="true">·</span>
                                <span>{q.section}</span>
                                <span aria-hidden="true">·</span>
                                <span>{q.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{q.subtopic}</span>
                                <span aria-hidden="true">·</span>
                                <span>Difficulty: {q.difficulty}</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-700 tabular-nums">
                                  +{q.markingRule.maxMarks} / -
                                  {q.markingRule.negativeMarks}M
                                </span>
                                {prevStatus && (
                                  <span className="font-mono font-semibold uppercase text-sky-700">
                                    History: {prevStatus}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBookmark(q.id)}
                                  className={`min-h-[34px] rounded border px-2.5 py-1 text-xs font-medium ${
                                    bookmarkedIds.has(q.id)
                                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {bookmarkedIds.has(q.id)
                                    ? 'Bookmarked'
                                    : 'Bookmark'}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <ShieldCheck className="h-3.5 w-3.5 text-sky-700" />
                                Verification: {vStatus} ({q.sourceClassification})
                              </span>
                              {q.officialSourceUrl && (
                                <a
                                  href={q.officialSourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                                >
                                  Official IITB Archive
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed text-slate-900">
                              {q.statement}
                            </p>

                            <QuestionDiagram
                              diagramType={q.diagramType}
                              imageUrl={q.imageUrl}
                            />

                            {/* Inline Answer Input */}
                            {q.questionType === 'NAT' && (
                              <div className="flex items-center gap-3 max-w-xs">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="any"
                                  value={
                                    typeof inlineAns === 'string'
                                      ? inlineAns
                                      : ''
                                  }
                                  onChange={(e) =>
                                    setInlineResponses((prev) => ({
                                      ...prev,
                                      [q.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter NAT numerical value..."
                                  className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900"
                                />
                              </div>
                            )}

                            {(q.questionType === 'MCQ' ||
                              q.questionType === 'MSQ') &&
                              q.options && (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  {q.options.map((opt) => {
                                    const selected =
                                      q.questionType === 'MCQ'
                                        ? inlineAns === opt.id
                                        : Array.isArray(inlineAns) &&
                                          inlineAns.includes(opt.id);
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          if (q.questionType === 'MCQ') {
                                            setInlineResponses((prev) => ({
                                              ...prev,
                                              [q.id]: opt.id,
                                            }));
                                          } else {
                                            const cur = Array.isArray(inlineAns)
                                              ? inlineAns
                                              : [];
                                            const next = cur.includes(opt.id)
                                              ? cur.filter((x) => x !== opt.id)
                                              : [...cur, opt.id].sort();
                                            setInlineResponses((prev) => ({
                                              ...prev,
                                              [q.id]: next,
                                            }));
                                          }
                                        }}
                                        className={`flex min-h-[44px] items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors ${
                                          selected
                                            ? 'border-sky-600 bg-sky-50 text-slate-900 font-medium'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span className="font-mono font-bold text-slate-900">
                                          {opt.id}.
                                        </span>
                                        <span>{opt.text}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <div className="flex items-center gap-2.5">
                                {q.part === 'Part B' ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('part-b-studio')}
                                    className="min-h-[38px] rounded-lg bg-sky-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                                  >
                                    Open in Part B Drawing Studio →
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineRevealedIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(q.id)) next.delete(q.id);
                                      else next.add(q.id);
                                      return next;
                                    });
                                  }}
                                  className="min-h-[38px] rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                                >
                                  {isRevealed
                                    ? 'Hide Answer & Solution'
                                    : 'Verify Answer & Solution'}
                                </button>
                              </div>
                            </div>

                            {isRevealed && (
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1.5">
                                <div className="font-semibold text-slate-900">
                                  Verified Correct Answer:{' '}
                                  <span className="font-mono text-emerald-700">
                                    {Array.isArray(q.correctAnswer)
                                      ? q.correctAnswer.join(', ')
                                      : q.correctAnswer}
                                  </span>
                                </div>
                                <p>
                                  <strong>Reasoning:</strong> {q.explanation}
                                </p>
                                <p>
                                  <strong>Concept Tested:</strong>{' '}
                                  {q.conceptTested} ·{' '}
                                  <strong>Practical Method:</strong>{' '}
                                  {q.practicalMethod}
                                </p>
                                <p>
                                  <strong>Takeaway:</strong> {q.shortTakeaway}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 3. PREVIOUS-YEAR PAPERS (YEAR-SPECIFIC OFFICIAL STRUCTURES) */}
              {activeTab === 'pyq-papers' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      UCEED Previous-Year Paper Structures & Calibration Sets
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      Uses the official exam structure and marking scheme of
                      each specific year (2020–2025) from{' '}
                      <a
                        href="https://www.uceed.iitb.ac.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 underline"
                      >
                        uceed.iitb.ac.in
                      </a>
                      .
                    </p>
                  </div>

                  {/* Year Pattern Comparison Table */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Official IIT Bombay UCEED Structural Evolution (2020–2025)
                    </h2>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 font-medium">Exam Years</th>
                            <th className="py-2 font-medium">Part A Structure</th>
                            <th className="py-2 font-medium">Part B Structure</th>
                            <th className="py-2 text-right font-medium">
                              Total Marks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-2.5 font-mono font-semibold text-slate-900">
                              2024 – 2025
                            </td>
                            <td className="py-2.5 text-slate-700">
                              57 Qs (200M · 120m): Sec 1 NAT (14 Qs, +4/0) · Sec
                              2 MSQ (15 Qs, +4/+3/+2/+1/-1) · Sec 3 MCQ (28 Qs,
                              +3/-0.71)
                            </td>
                            <td className="py-2.5 text-slate-700">
                              2 Qs (100M · 60m): Q1 Scene Sketching (50M) + Q2
                              Design Aptitude (50M)
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                              300 Marks
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-mono font-semibold text-slate-900">
                              2020 – 2023
                            </td>
                            <td className="py-2.5 text-slate-700">
                              68 Qs (240M · 150m): Sec 1 NAT (18 Qs, +4/0) · Sec
                              2 MSQ (18 Qs, +4/+3/+2/+1/-1) · Sec 3 MCQ (32 Qs,
                              +3/-0.71)
                            </td>
                            <td className="py-2.5 text-slate-700">
                              1 Q (60M · 30m): Mandatory Scene Perspective
                              Drawing (60M)
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                              300 Marks
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Paper Cards */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {EXAM_PAPERS.map((paper) => (
                      <div
                        key={paper.id}
                        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-900">
                              Exam Year: {paper.year}
                            </span>
                            <span className="font-mono tabular-nums">
                              Duration: {paper.durationMinutes}m · Total:{' '}
                              {paper.totalMarks}M
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {paper.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-slate-600">
                            {paper.description}
                          </p>

                          <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                            {paper.sections.map((s) => (
                              <div
                                key={s.name}
                                className="flex items-center justify-between"
                              >
                                <span className="font-medium text-slate-800">
                                  {s.name}
                                </span>
                                <span className="font-mono text-slate-600 tabular-nums">
                                  {s.questionCount} Qs · +{s.marksPerQuestion} /
                                  -{s.negativeMarks}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => launchExamPaper(paper, 'exam')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Start in Timed Exam Mode
                          </button>
                          <button
                            type="button"
                            onClick={() => launchExamPaper(paper, 'practice')}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Solve in Practice Mode (Instant Key)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. MOCK TESTS */}
              {activeTab === 'mock-tests' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      Timed Mock Tests & Custom Section Sprints
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                      Simulate real exam pressure with strict section marking,
                      question palette tracking, and refresh-resilient countdown
                      timers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-sky-700">
                          FULL CALIBRATION MOCK
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          UCEED 2025 Part A + Part B Simulation
                        </h3>
                        <p className="text-xs text-slate-600">
                          Includes NAT (+4/0), MSQ (+4/+3/+2/+1/-1), MCQ
                          (+3/-0.71), and Part B prompts. Solutions hidden until
                          final submission.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => launchExamPaper(EXAM_PAPERS[0], 'exam')}
                        className="min-h-[44px] w-full rounded-lg bg-sky-700 py-2.5 text-xs font-semibold text-white hover:bg-sky-800"
                      >
                        Launch Exam Mode (55m)
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-emerald-700">
                          ZERO-NEGATIVE SPRINT
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Section 1 (NAT) Speed & Precision Drill
                        </h3>
                        <p className="text-xs text-slate-600">
                          Focus strictly on 4-mark Numerical Answer Type
                          problems (3D surface counting, gear trains, Reuleaux
                          rollers, polyhedra).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          launchCustomPracticeSet(
                            questions.filter((q) => q.questionType === 'NAT'),
                            'Section 1 (NAT) Precision Mock',
                            'exam'
                          )
                        }
                        className="min-h-[44px] w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Launch NAT Mock
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-amber-700">
                          PARTIAL-MARKING STRATEGY
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Section 2 (MSQ) Risk-Control Drill
                        </h3>
                        <p className="text-xs text-slate-600">
                          Master the official UCEED MSQ partial-credit rules
                          (+4/+3/+2/+1) while avoiding the -1 false-positive
                          penalty.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          launchCustomPracticeSet(
                            questions.filter((q) => q.questionType === 'MSQ'),
                            'Section 2 (MSQ) Partial-Credit Mock',
                            'exam'
                          )
                        }
                        className="min-h-[44px] w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Launch MSQ Mock
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PART B STUDIO */}
              {activeTab === 'part-b-studio' && (
                <PartBStudioView
                  partBQuestions={questions.filter((q) => q.part === 'Part B')}
                  submissions={partBSubmissions}
                  onSaveSubmission={(newSub) =>
                    setPartBSubmissions((prev) => [newSub, ...prev])
                  }
                />
              )}

              {/* 6. PERFORMANCE ANALYTICS */}
              {activeTab === 'analytics' && (
                <AnalyticsView
                  attempts={attempts}
                  onPracticeTopic={(category) => {
                    const topicQs = questions.filter(
                      (q) => q.isPublished && q.category === category
                    );
                    launchCustomPracticeSet(
                      topicQs,
                      `Topic Drill: ${category}`,
                      'practice'
                    );
                  }}
                />
              )}

              {/* 7. AI STUDY COACH */}
              {activeTab === 'ai-coach' && (
                <AIStudyCoachView
                  attempts={attempts}
                  dailyStudyGoalMinutes={profile.dailyStudyGoalMinutes}
                />
              )}

              {/* 8. BOOKMARKS */}
              {activeTab === 'bookmarks' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Saved Bookmarks & Revision Notebook ({bookmarks.length})
                      </h1>
                      <p className="mt-1 text-xs text-slate-500">
                        Review high-yield questions and personal takeaways, or
                        launch a revision practice session with all bookmarked
                        questions.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={bookmarks.length === 0}
                      onClick={() => {
                        const bQuestions = questions.filter((q) =>
                          bookmarkedIds.has(q.id)
                        );
                        launchCustomPracticeSet(
                          bQuestions,
                          'Bookmarked Questions Revision Session',
                          'practice'
                        );
                      }}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-40"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Practice All Bookmarked Questions ({bookmarks.length})
                    </button>
                  </div>

                  {bookmarks.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        No bookmarked questions yet.
                      </p>
                      <p className="text-xs text-slate-500">
                        Click &ldquo;Bookmark&rdquo; on any question in the
                        Question Bank or Test Evaluation screen to save it here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookmarks.map((bm) => {
                        const q = questions.find(
                          (item) => item.id === bm.questionId
                        );
                        if (!q) return null;
                        return (
                          <div
                            key={bm.questionId}
                            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                              <div>
                                <span className="font-mono font-bold text-slate-900">
                                  {q.code}
                                </span>{' '}
                                · {q.year} · {q.category} · {q.questionType}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleBookmark(bm.questionId)
                                }
                                className="text-red-600 hover:underline font-medium"
                              >
                                Remove Bookmark
                              </button>
                            </div>

                            <p className="text-sm text-slate-900">
                              {q.statement}
                            </p>

                            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                              <strong>Personal Revision Note:</strong>{' '}
                              {bm.personalNote}
                            </div>

                            <div className="text-xs text-slate-600">
                              <strong>Verified Answer:</strong>{' '}
                              <span className="font-mono font-semibold text-emerald-700">
                                {Array.isArray(q.correctAnswer)
                                  ? q.correctAnswer.join(', ')
                                  : q.correctAnswer}
                              </span>{' '}
                              — {q.shortTakeaway}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 9. PROFILE AND SETTINGS (INCLUDES ADMIN STUDIO & SUPABASE SQL) */}
              {activeTab === 'settings' && (
                <ProfileSettingsView
                  profile={profile}
                  questions={questions}
                  onUpdateProfile={setProfile}
                  onAddQuestions={(newQs) =>
                    setQuestions((prev) => [...newQs, ...prev])
                  }
                  onTogglePublishQuestion={(id) =>
                    setQuestions((prev) =>
                      prev.map((q) =>
                        q.id === id ? { ...q, isPublished: !q.isPublished } : q
                      )
                    )
                  }
                  onResetDemoData={() => {
                    const initialAttempts =
                      createInitialDemoAttempts(INITIAL_QUESTIONS);
                    setQuestions(INITIAL_QUESTIONS);
                    setAttempts(initialAttempts);
                    setBookmarks(INITIAL_DEMO_BOOKMARKS);
                    setPartBSubmissions(INITIAL_DEMO_PART_B_SUBMISSIONS);
                    try {
                      localStorage.removeItem('uceed_prep_questions_v1');
                      localStorage.removeItem('uceed_prep_attempts_v1');
                      localStorage.removeItem('uceed_prep_bookmarks_v1');
                      localStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY);
                    } catch {
                      // Ignore
                    }
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Primary Destinations: Dashboard, Practice, Mock Tests, Analytics, Profile) */}
      <nav
        aria-label="Mobile bottom navigation"
        data-testid="mobile-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5">
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !viewingResultAttempt;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`mobile-nav-${tab.id}`}
                onClick={() => {
                  setViewingResultAttempt(null);
                  setActiveTab(tab.id);
                  setMobileNavOpen(false);
                }}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[68px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
