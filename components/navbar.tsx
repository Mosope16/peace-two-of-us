'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  Mail,
  Clock,
  CheckSquare,
  Calendar,
  Settings,
  Smile,
  ChevronDown,
  Gamepad2,
  LogIn,
} from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useLDRStore } from '@/lib/store';
import { getMoodDetails, MOOD_OPTIONS } from '@/lib/utils';
import { useMoods, useSetMood } from '@/lib/queries/useMoods';

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, currentUser, partner, couple, logoutUser } = useLDRStore();
  const { signOut } = useClerk();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { data: moodLogs = [] } = useMoods();
  const setMoodMutation = useSetMood();

  const canShowPrivateNav = isLoaded && isSignedIn && isAuthenticated;
  const activeMoodLog = canShowPrivateNav ? moodLogs.find((m) => m.user_id === currentUser.id) : null;
  const partnerMoodLog = canShowPrivateNav && partner && couple && (couple.status === 'connected' || couple.is_connected) ? moodLogs.find((m) => m.user_id === partner.id) : null;
  const partnerMoodDetails = partnerMoodLog ? getMoodDetails(partnerMoodLog.mood) : null;

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Heart },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Love Letters', href: '/letters', icon: Mail },
    { name: 'Timeline', href: '/timeline', icon: Clock },
    { name: 'Countdowns', href: '/countdowns', icon: Calendar },
    { name: 'Bucket List', href: '/bucket-list', icon: CheckSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    logoutUser();
    setIsUserDropdownOpen(false);
    await signOut({ redirectUrl: '/login' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="flex items-center justify-center text-primary font-bold text-2xl group-hover:scale-105 transition-transform">
                ∞
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-white">Peace</span>
              </div>
            </Link>

            {canShowPrivateNav && <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${ isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-zinc-300 hover:text-white hover:bg-white/5' }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-zinc-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>}

            <div className="flex items-center space-x-3">
              {!canShowPrivateNav ? (
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </Link>
              ) : (
                <>
              {partnerMoodDetails && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-xs shadow-inner">
                  <span className="text-zinc-400 font-medium">{partner?.name.split(' ')[0]}&apos;s Mood:</span>
                  <span className="text-sm">{partnerMoodDetails.emoji}</span>
                  <span className={`font-semibold ${partnerMoodDetails.color}`}>{partnerMoodDetails.label}</span>
                </div>
              )}

              <button
                onClick={() => setIsMoodModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 text-xs font-semibold transition-all shadow-sm"
              >
                <Smile className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">My Mood</span>
                {activeMoodLog && <span className="text-sm">{getMoodDetails(activeMoodLog.mood).emoji}</span>}
              </button>

              <div className="relative shrink-0">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg bg-surface border border-border hover:border-primary/40 text-xs text-zinc-200 transition-all shrink-0"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/50 shrink-0"
                  />
                  <span className="font-medium hidden md:inline whitespace-nowrap shrink-0">{currentUser.username || currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 soft-card rounded-xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-border text-xs text-zinc-400">
                      <span>Account Menu</span>
                    </div>

                    <Link
                      href="/login"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span>🔑 Sign In / Create Account</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>Couple Settings</span>
                    </Link>

                    <div className="my-1 border-t border-border" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <span>🚪 Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          </div>
        </div>

        {canShowPrivateNav && <div className="md:hidden flex items-center space-x-1 border-t border-border px-3 py-2 bg-surface text-xs overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center py-1.5 px-3 rounded-lg flex-shrink-0 transition-colors ${ isActive ? 'bg-primary/20 text-primary font-bold border border-primary/30' : 'text-zinc-400 hover:text-zinc-200' }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>}
      </header>

      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="soft-card w-full max-w-md rounded-2xl p-6 border border-border relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gradient text-center mb-1">How are you feeling today?</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">
              Your partner {partner?.name.split(' ')[0]} will see your latest mood on their dashboard ❤️
            </p>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setMoodMutation.mutate({ mood: option.id });
                    setIsMoodModalOpen(false);
                  }}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all hover:scale-105 ${
                    activeMoodLog?.mood === option.id
                      ? `${option.bgColor} ring-2 ring-rose-500`
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-3xl mb-1">{option.emoji}</span>
                  <span className={`text-[10px] font-semibold ${option.color}`}>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsMoodModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
