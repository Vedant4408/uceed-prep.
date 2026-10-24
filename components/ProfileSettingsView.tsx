'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  LogIn,
  LogOut,
  Plus,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  DifficultyLevel,
  ExamPart,
  Question,
  QuestionType,
  SourceClassification,
  UCEEDCategory,
  UserProfile,
} from '@/lib/types';
import { UCEED_CATEGORIES } from '@/lib/questions-data';
import {
  CsvValidationIssue,
  getQuestionVerificationStatus,
  parseAndValidateQuestionCsv,
  parseAndValidateQuestionJson,
} from '@/lib/scoring';
import { SUPABASE_SQL_MIGRATION } from '@/lib/supabase-schema';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { ThemeToggleButton, useTheme } from './ThemeProvider';

interface ProfileSettingsViewProps {
  profile: UserProfile;
  questions: Question[];
  onUpdateProfile: (updated: UserProfile) => void;
  onAddQuestions: (newQuestions: Question[]) => void;
  onTogglePublishQuestion: (id: string) => void;
  onResetDemoData: () => void;
}

export function ProfileSettingsView({
  profile,
  questions,
  onUpdateProfile,
  onAddQuestions,
  onTogglePublishQuestion,
  onResetDemoData,
}: ProfileSettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'admin' | 'database'
  >('profile');

  // Auth form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>(
    'signin'
  );
  const [authEmail, setAuthEmail] = useState(profile.email);
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState(profile.name);
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);

  // Admin manual question form state
  const [newCode, setNewCode] = useState('UCEED-2025-S1-Q15');
  const [newYear, setNewYear] = useState(2025);
  const [newPart, setNewPart] = useState<ExamPart>('Part A');
  const [newType, setNewType] = useState<QuestionType>('NAT');
  const [newCategory, setNewCategory] = useState<UCEEDCategory>(
    'Visualization and spatial reasoning'
  );
  const [newSubtopic, setNewSubtopic] = useState('Orthographic Projections');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('Medium');
  const [newMaxMarks, setNewMaxMarks] = useState(4);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newSourceClass, setNewSourceClass] = useState<SourceClassification>(
    'Original Practice Question (UCEED Calibration)'
  );
  const [showPreview, setShowPreview] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // CSV / JSON Import State
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [csvInput, setCsvInput] = useState('');
  const [csvIssues, setCsvIssues] = useState<CsvValidationIssue[]>([]);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatusMsg(null);
    const supabase = getSupabaseClient();

    if (!supabase) {
      if (authMode === 'reset') {
        setAuthStatusMsg(
          'Demo Mode: Password reset simulation completed. Connect Supabase in .env to enable live email recovery.'
        );
        return;
      }
      onUpdateProfile({
        ...profile,
        name: authFullName || 'Aarav Mehta',
        email: authEmail || 'student@iitb-prep.demo',
      });
      setAuthStatusMsg(
        `Demo Mode session updated for ${authEmail}. Configure NEXT_PUBLIC_SUPABASE_URL to persist across cloud devices.`
      );
      return;
    }

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { data: { full_name: authFullName } },
        });
        if (error) throw error;
        setAuthStatusMsg('Account created! Please check your email to verify.');
      } else if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        onUpdateProfile({
          ...profile,
          email: authEmail,
          isDemoMode: false,
        });
        setAuthStatusMsg('Signed in via Supabase Auth.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail);
        if (error) throw error;
        setAuthStatusMsg('Password reset link sent to your email.');
      }
    } catch (err) {
      setAuthStatusMsg(
        err instanceof Error ? err.message : 'Authentication error.'
      );
    }
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.role !== 'admin') {
      setAdminFeedback(
        'Access denied: Only authorized administrators can modify question keys.'
      );
      return;
    }
    if (!newStatement.trim() || !newCorrectAnswer.trim()) {
      setAdminFeedback(
        'Validation Error: Question statement and verified correct answer are required.'
      );
      return;
    }

    const created: Question = {
      id: `admin-q-${Date.now()}`,
      code: newCode.trim() || `UCEED-${newYear}-${Date.now()}`,
      year: newYear,
      part: newPart,
      section:
        newPart === 'Part B' ? 'Part B (Drawing)' : `Section (${newType})`,
      category: newCategory,
      subtopic: newSubtopic || 'General Aptitude',
      questionType: newType,
      difficulty: newDifficulty,
      statement: newStatement.trim(),
      diagramType: 'none',
      options:
        newType === 'MCQ' || newType === 'MSQ'
          ? [
              { id: 'A', text: newOptA || 'Option A' },
              { id: 'B', text: newOptB || 'Option B' },
              { id: 'C', text: newOptC || 'Option C' },
              { id: 'D', text: newOptD || 'Option D' },
            ]
          : undefined,
      correctAnswer:
        newType === 'MSQ'
          ? newCorrectAnswer.split(',').map((s) => s.trim().toUpperCase())
          : newCorrectAnswer.trim(),
      markingRule: {
        maxMarks: Number(newMaxMarks),
        negativeMarks: Number(newNegativeMarks),
        partialMarkingAllowed: newType === 'MSQ',
        description: `+${newMaxMarks} for correct, -${newNegativeMarks} for incorrect`,
      },
      recommendedTimeSeconds: newPart === 'Part B' ? 1800 : 120,
      sourceClassification: newSourceClass,
      isPublished: true,
      explanation:
        newExplanation.trim() || 'Verified explanation added by administrator.',
      conceptTested: newSubtopic,
      practicalMethod: 'Systematic elimination and constraint check.',
      shortTakeaway: 'Verify units and orientation before submitting.',
      commonMistakeNote: 'Rushing through multi-step spatial constraints.',
    };

    onAddQuestions([created]);
    setNewStatement('');
    setNewCorrectAnswer('');
    setNewExplanation('');
    setAdminFeedback(
      `Published ${created.code} (${created.sourceClassification}) to Question Bank.`
    );
  };

  const handleLoadSampleCsv = () => {
    setImportFormat('csv');
    const sample = [
      'code,year,part,questionType,category,subtopic,difficulty,maxMarks,negativeMarks,statement,optionA,optionB,optionC,optionD,correctAnswer,explanation,sourceClassification',
      'UCEED-2025-CSV-01,2025,Part A,NAT,Visualization and spatial reasoning,Folding & Cuts,Medium,4,0,"A square sheet of paper is folded twice along its diagonals and a circular hole is punched through the center vertex. How many holes appear when unfolded?", , , , ,1,"Punching the central vertex creates a single central circular hole.",Original Practice Question (UCEED Calibration)',
      'UCEED-2025-CSV-02,2025,Part A,MCQ,Observation and visual sensitivity,Color Theory,Easy,3,0.71,"Which color pair represents true complementary opposites on the subtractive RYB artist color wheel?",Red and Cyan,Blue and Orange,Yellow and Green,Magenta and Red,B,"Blue and Orange lie opposite on the traditional RYB wheel.",Original Practice Question (UCEED Calibration)',
      'INVALID-ROW-EXAMPLE,1990,Part Z,UNKNOWN,Visualization,Sub,Impossible,-4,-2,Too short, , , , ,,Missing answer key,Original Practice Question (UCEED Calibration)',
    ].join('\n');
    setCsvInput(sample);
    setCsvIssues([]);
    setCsvSuccessMsg(null);
  };

  const handleLoadSampleJson = () => {
    setImportFormat('json');
    const sampleJson = JSON.stringify(
      [
        {
          code: 'UCEED-2025-JSON-01',
          year: 2025,
          part: 'Part A',
          questionType: 'NAT',
          category: 'Basic mathematics and numerical aptitude',
          subtopic: 'Gear Ratio & Pulleys',
          difficulty: 'Medium',
          maxMarks: 4,
          negativeMarks: 0,
          statement:
            'A 20-tooth pinion gear rotating at 90 RPM drives a 60-tooth spur gear. What is the rotational speed (in RPM) of the 60-tooth gear?',
          correctAnswer: '30',
          explanation: 'RPM_out = 90 * (20 / 60) = 30 RPM.',
          verificationStatus: 'Imported (Awaiting Verification)',
        },
        {
          code: 'UCEED-2024-S1-Q01', // Intentional duplicate of existing code to demonstrate duplicate validation!
          year: 2024,
          part: 'Part A',
          questionType: 'NAT',
          category: 'Visualization and spatial reasoning',
          subtopic: 'Duplicate Check Demo',
          difficulty: 'Medium',
          maxMarks: 4,
          negativeMarks: 0,
          statement:
            'This sample item intentionally reuses an existing question code to demonstrate duplicate ID/code protection.',
          correctAnswer: '14',
        },
      ],
      null,
      2
    );
    setCsvInput(sampleJson);
    setCsvIssues([]);
    setCsvSuccessMsg(null);
  };

  const handleValidateAndImportCsv = () => {
    if (profile.role !== 'admin') return;
    const existingCodes = new Set(questions.map((q) => q.code.toUpperCase()));
    const { validQuestions, invalidRows } =
      importFormat === 'json' || csvInput.trim().startsWith('[')
        ? parseAndValidateQuestionJson(csvInput, existingCodes)
        : parseAndValidateQuestionCsv(csvInput, existingCodes);
    setCsvIssues(invalidRows);
    if (validQuestions.length > 0) {
      onAddQuestions(validQuestions);
      setCsvSuccessMsg(
        `Successfully imported ${validQuestions.length} valid question(s). ${
          invalidRows.length > 0
            ? `${invalidRows.length} invalid or duplicate item(s) were rejected and listed below.`
            : ''
        }`
      );
    } else {
      setCsvSuccessMsg(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account, Admin Content Studio & Database Architecture
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage study goals, authentication, protected question bank
            administration, CSV bulk imports, and Supabase RLS migrations.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profile & Auth
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('admin')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Question Manager ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === 'database'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supabase SQL & Setup Guide
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE, STUDY GOALS & AUTH */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Student Profile & Exam Goal Preferences */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Student Profile & UCEED Target
                </h2>
                <p className="text-xs text-slate-500">
                  Mode:{' '}
                  {isSupabaseConfigured
                    ? 'Connected Supabase Project'
                    : 'Local Demo Mode (Clearly Labeled Sample Data)'}
                </p>
              </div>
              <span className="font-mono text-xs font-semibold uppercase text-sky-700">
                Role: {profile.role}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block font-medium text-slate-700"
                >
                  Student Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="target-exam-year"
                    className="block font-medium text-slate-700"
                  >
                    Target UCEED Exam Year
                  </label>
                  <select
                    id="target-exam-year"
                    value={profile.targetExamYear}
                    onChange={(e) =>
                      onUpdateProfile({
                        ...profile,
                        targetExamYear: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value={2025}>UCEED 2025</option>
                    <option value={2026}>UCEED 2026</option>
                    <option value={2027}>UCEED 2027</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="daily-study-goal"
                    className="block font-medium text-slate-700"
                  >
                    Daily Study Goal (Minutes)
                  </label>
                  <input
                    id="daily-study-goal"
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={profile.dailyStudyGoalMinutes}
                    onChange={(e) =>
                      onUpdateProfile({
                        ...profile,
                        dailyStudyGoalMinutes: Number(e.target.value) || 60,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums"
                  />
                </div>
              </div>

              {/* Appearance & Theme Settings Card */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      Appearance & Color Theme
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Active mode:{' '}
                      <strong className="font-mono uppercase text-sky-700">
                        {theme}
                      </strong>{' '}
                      (Saved in localStorage)
                    </span>
                  </div>
                  <ThemeToggleButton
                    showLabel
                    testId="settings-theme-toggle"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                      theme === 'light'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                      theme === 'dark'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Dark Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem(THEME_STORAGE_KEY);
                        const prefersDark =
                          typeof window !== 'undefined' &&
                          window.matchMedia('(prefers-color-scheme: dark)')
                            .matches;
                        setTheme(prefersDark ? 'dark' : 'light');
                      } catch {
                        // Ignore
                      }
                    }}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Use Device Preference
                  </button>
                </div>
              </div>

              {/* Role Switcher for Demo Evaluation of Admin Protection */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Access Control Role Preview
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProfile({
                        ...profile,
                        role: profile.role === 'admin' ? 'student' : 'admin',
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Switch to {profile.role === 'admin' ? 'Student' : 'Admin'}{' '}
                    Role
                  </button>
                </div>
                <p className="text-slate-600">
                  Ordinary students can never modify official answer keys.
                  Toggle between <strong>Student</strong> and{' '}
                  <strong>Admin</strong> to test role-based protection in the
                  Admin Question Manager tab.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-slate-500">
                  Reset local attempts & bookmarks back to clean sample state:
                </span>
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Reset Demo Workspace
                </button>
              </div>
            </div>
          </div>

          {/* Supabase Authentication Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Supabase Authentication
                </h2>
                <p className="text-xs text-slate-500">
                  Sign in, create an account, or request a password reset.
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {(['signin', 'signup', 'reset'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAuthMode(m)}
                    className={`rounded px-2.5 py-1 font-medium capitalize ${
                      authMode === m
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    {m === 'signin'
                      ? 'Sign In'
                      : m === 'signup'
                      ? 'Sign Up'
                      : 'Reset'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block font-medium text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              {authMode !== 'reset' && (
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              )}

              {authStatusMsg && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-900">
                  {authStatusMsg}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {authMode === 'signin'
                    ? 'Sign In to Account'
                    : authMode === 'signup'
                    ? 'Create Student Account'
                    : 'Send Password Reset Email'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAuthStatusMsg(
                      'Signed out of active session. Returned to labeled Demo Mode.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PROTECTED ADMIN QUESTION MANAGER & CSV IMPORT */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6">
          {profile.role !== 'admin' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-xs text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold">
                    Protected Administrator Area (Read-Only for Ordinary
                    Students)
                  </div>
                  <p className="mt-1">
                    You are currently viewing as a <strong>Student</strong>.
                    Ordinary students cannot add questions or modify official
                    answer keys. To test admin publishing and CSV imports in
                    Demo Mode, click the button on the right.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateProfile({ ...profile, role: 'admin' })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <UserCheck className="h-4 w-4" />
                Enable Admin Role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Add Single Question Form */}
              <form
                onSubmit={handleCreateQuestion}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Add & Publish New UCEED Question
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPreview((p) => !p)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showPreview ? 'Hide Preview' : 'Preview Question'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700">
                      Question Code
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Exam Year
                    </label>
                    <input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Part & Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => {
                        const t = e.target.value as QuestionType;
                        setNewType(t);
                        setNewPart(t === 'DRAWING' ? 'Part B' : 'Part A');
                      }}
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    >
                      <option value="NAT">Part A · NAT</option>
                      <option value="MSQ">Part A · MSQ</option>
                      <option value="MCQ">Part A · MCQ</option>
                      <option value="DRAWING">Part B · DRAWING</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value as UCEEDCategory)
                      }
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    >
                      {UCEED_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Source Verification Status
                    </label>
                    <select
                      value={newSourceClass}
                      onChange={(e) =>
                        setNewSourceClass(
                          e.target.value as SourceClassification
                        )
                      }
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    >
                      <option value="Official UCEED Structure (Verified Pattern)">
                        Official UCEED Structure (Verified Pattern)
                      </option>
                      <option value="Original Practice Question (UCEED Calibration)">
                        Original Practice Question (UCEED Calibration)
                      </option>
                      <option value="AI-Generated Targeted Practice">
                        AI-Generated Targeted Practice
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700">
                      Difficulty
                    </label>
                    <select
                      value={newDifficulty}
                      onChange={(e) =>
                        setNewDifficulty(e.target.value as DifficultyLevel)
                      }
                      className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Max Marks (+)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newMaxMarks}
                      onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Negative Marks (-)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newNegativeMarks}
                      onChange={(e) =>
                        setNewNegativeMarks(Number(e.target.value))
                      }
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700">
                    Question Statement
                  </label>
                  <textarea
                    rows={2}
                    value={newStatement}
                    onChange={(e) => setNewStatement(e.target.value)}
                    placeholder="Enter complete UCEED question statement..."
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                {(newType === 'MCQ' || newType === 'MSQ') && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={newOptA}
                      onChange={(e) => setNewOptA(e.target.value)}
                      className="rounded border border-slate-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={newOptB}
                      onChange={(e) => setNewOptB(e.target.value)}
                      className="rounded border border-slate-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={newOptC}
                      onChange={(e) => setNewOptC(e.target.value)}
                      className="rounded border border-slate-300 px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={newOptD}
                      onChange={(e) => setNewOptD(e.target.value)}
                      className="rounded border border-slate-300 px-2.5 py-1.5"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700">
                      Verified Answer Key (e.g. 14, B, or A,C)
                    </label>
                    <input
                      type="text"
                      value={newCorrectAnswer}
                      onChange={(e) => setNewCorrectAnswer(e.target.value)}
                      placeholder="14"
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700">
                      Subtopic / Concept
                    </label>
                    <input
                      type="text"
                      value={newSubtopic}
                      onChange={(e) => setNewSubtopic(e.target.value)}
                      className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700">
                    Detailed Official Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={newExplanation}
                    onChange={(e) => setNewExplanation(e.target.value)}
                    placeholder="Step-by-step reasoning..."
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                  />
                </div>

                {showPreview && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-slate-800 space-y-1">
                    <div className="font-mono font-semibold text-sky-900">
                      Preview: {newCode} ({newYear} · {newType})
                    </div>
                    <p>{newStatement || '(No statement entered yet)'}</p>
                    <div className="text-slate-600">
                      Key: {newCorrectAnswer || 'N/A'} · Marks: +{newMaxMarks}/-
                      {newNegativeMarks}
                    </div>
                  </div>
                )}

                {adminFeedback && (
                  <p className="font-medium text-emerald-700">{adminFeedback}</p>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Publish Question to Bank
                </button>
              </form>

              {/* CSV / JSON Bulk Importer with Row & Duplicate Validator */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      CSV & JSON Bulk Question Import Validator
                    </h2>
                    <p className="text-slate-500">
                      Validates missing fields, duplicate question codes, answer
                      formats, and marking rules before importing.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Sample CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleJson}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Sample JSON
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Paste CSV rows or JSON array of questions here..."
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono text-[11px] text-slate-900"
                />

                <button
                  type="button"
                  onClick={handleValidateAndImportCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Validate & Import Questions
                </button>

                {csvSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{csvSuccessMsg}</span>
                  </div>
                )}

                {csvIssues.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-red-900">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      Rejected Invalid / Duplicate Items ({csvIssues.length}):
                    </div>
                    {csvIssues.map((iss) => (
                      <div
                        key={iss.rowNumber}
                        className="rounded bg-white/80 p-2 text-[11px]"
                      >
                        <strong className="font-mono">
                          Item #{iss.rowNumber} ({iss.code}):
                        </strong>{' '}
                        {iss.errors.join(' | ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Published & Draft Question Inventory Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">
              Question Bank Repository ({questions.length} Questions)
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Code</th>
                    <th className="py-2 font-medium">Year / Type</th>
                    <th className="py-2 font-medium">Category</th>
                    <th className="py-2 font-medium">Source Label</th>
                    <th className="py-2 font-medium">Verified Answer</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono font-semibold text-slate-900">
                        {q.code}
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {q.year} · {q.questionType}
                      </td>
                      <td className="py-2.5 text-slate-700">{q.category}</td>
                      <td className="py-2.5 text-slate-500">
                        {q.sourceClassification}
                      </td>
                      <td className="py-2.5 font-mono font-semibold text-emerald-700">
                        {Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.join(', ')
                          : q.correctAnswer}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          disabled={profile.role !== 'admin'}
                          onClick={() => onTogglePublishQuestion(q.id)}
                          className={`rounded border px-2.5 py-1 text-[11px] font-medium ${
                            q.isPublished
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          } disabled:opacity-50`}
                        >
                          {q.isPublished ? 'Published' : 'Unpublished'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPABASE SQL MIGRATIONS & DEPLOYMENT ARCHITECTURE */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-sky-700" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Normalized 12-Table Supabase SQL Schema & RLS Migration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Includes profiles, questions, question_options,
                    question_assets, exams, exam_questions, test_attempts,
                    attempt_responses, bookmarks, topic_mastery,
                    ai_analysis_reports, and study_plans.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedSql ? 'Copied SQL Migration!' : 'Copy Full SQL Script'}
              </button>
            </div>

            <pre className="max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">
              {SUPABASE_SQL_MIGRATION}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
