'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, Download, RefreshCw, Share, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  unsyncedCount: number;
  onSyncPending?: () => void;
}

export function PWAInstallPrompt({
  unsyncedCount,
  onSyncPending,
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initTimer = setTimeout(() => {
      setIsOnline(navigator.onLine);
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean(
          (window.navigator as unknown as { standalone?: boolean }).standalone
        );
      setIsInstalled(standalone);

      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
    }, 0);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker safely
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in restricted preview iframes
      });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Offline / Unsynced Status Pill */}
        {!isOnline ? (
          <span
            data-testid="offline-status-banner"
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
          >
            <CloudOff className="h-3.5 w-3.5 text-amber-700" />
            <span>Offline Mode · Answers saved locally</span>
          </span>
        ) : unsyncedCount > 0 ? (
          <button
            type="button"
            onClick={onSyncPending}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{unsyncedCount} local attempt(s) saved</span>
          </button>
        ) : null}

        {/* Install App Trigger */}
        {!isInstalled && (
          <button
            type="button"
            onClick={triggerInstall}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            title="Install UCEED Prep Lab on your phone or desktop"
          >
            <Download className="h-3.5 w-3.5 text-sky-700" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install UCEED Prep Lab PWA"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-700 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Install UCEED Prep Lab
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fast home-screen launch & offline PYQ practice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {isIOS ? (
                <>
                  <p className="font-semibold text-slate-900">
                    To install on iPhone or iPad (Safari):
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>
                      Tap the <strong>Share</strong> button{' '}
                      <Share className="inline h-3.5 w-3.5 text-sky-700" /> in
                      Safari’s bottom toolbar.
                    </li>
                    <li>
                      Scroll down and tap <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Add</strong> to launch UCEED Prep Lab in
                      fullscreen standalone mode.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">
                    To install on Android, Chrome, or Edge:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>
                      Open the browser menu (three dots in the top-right corner)
                      or click the install icon in the address bar.
                    </li>
                    <li>
                      Select <strong>Install app</strong> or{' '}
                      <strong>Add to Home screen</strong>.
                    </li>
                    <li>
                      Cached PYQs and active exam timers will remain accessible
                      even during spotty mobile connectivity.
                    </li>
                  </ol>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-emerald-700">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Service Worker & Offline Cache Ready
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[38px] rounded-lg bg-slate-900 px-4 py-1.5 font-semibold text-white hover:bg-slate-800"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
