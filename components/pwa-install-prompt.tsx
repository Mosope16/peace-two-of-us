'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && Boolean((window.navigator as unknown as { standalone?: boolean }).standalone))
    );
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Check if user dismissed recently (24 hour cooldown)
    const dismissedAt = localStorage.getItem('ldr_pwa_dismissed');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|optios/.test(userAgent);

    if (isAppleDevice && isSafari) {
      const timer = setTimeout(() => {
        setIsIOS(true);
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Capture Chromium/Android/Desktop beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Reveal prompt smoothly after a short delay
      setTimeout(() => setShowPrompt(true), 2500);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('ldr_pwa_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || installed || !showPrompt) return null;

  return (
    <>
      {/* Floating Bottom-Right / Mobile-Bottom Install Card */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="soft-card rounded-2xl p-4 sm:p-5 border border-rose-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-rose-500/10 space-y-3 relative overflow-hidden">
          {/* Subtle Glow Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center p-2 shadow-md shadow-rose-500/20 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                  <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/>
                </svg>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-sm font-bold text-white">Install Peace App</h4>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Instant real-time sync, full screen mode &amp; quick access.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? 'How to Install' : 'Install Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="soft-card w-full max-w-md rounded-3xl p-6 border border-border bg-zinc-950 space-y-5 text-left relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              To install <strong className="text-white">Peace</strong> on your home screen for full-screen mode:
            </p>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white flex items-center space-x-1">
                    <span>Tap the Safari Share button</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Located at the bottom of your Safari browser bar.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white flex items-center space-x-1">
                    <span>Select &ldquo;Add to Home Screen&rdquo;</span>
                    <PlusSquare className="w-3.5 h-3.5 text-rose-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Scroll down the share options list and tap Add to Home Screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Tap &ldquo;Add&rdquo; in the top right</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Peace will appear as a native app icon on your home screen!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

