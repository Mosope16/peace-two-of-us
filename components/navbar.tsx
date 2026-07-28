'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Heart, 
  Image as ImageIcon, 
  Mail, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Settings, 
  Smile, 
  Users,
  ChevronDown,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { getMoodDetails, MOOD_OPTIONS } from '@/lib/utils';
import { MoodType } from '@/types';
import { useMoods, useSetMood } from '@/lib/queries/useMoods';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, partner, couple, logoutUser } = useLDRStore();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { data: moodLogs = [] } = useMoods();
  const setMoodMutation = useSetMood();

  const activeMoodLog = moodLogs.find(m => m.user_id === currentUser.id);
  const partnerMoodLog = partner && couple.is_connected ? moodLogs.find(m => m.user_id === partner.id) : null;
  const partnerMoodDetails = partnerMoodLog ? getMoodDetails(partnerMoodLog.mood) : null;

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Heart },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Memories', href: '/memories', icon: ImageIcon },
    { name: 'Love Letters', href: '/letters', icon: Mail },
    { name: 'Timeline', href: '/timeline', icon: Clock },
    { name: 'Countdowns', href: '/countdowns', icon: Calendar },
    { name: 'Bucket List', href: '/bucket-list', icon: CheckSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-nav backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6 text-white fill-white animate-heartbeat" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-gradient">TwoOfUs</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  LDR Space
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Bar: Partner Mood + User Switcher */}
            <div className="flex items-center space-x-3">
              
              {/* Partner's Latest Mood Pill */}
              {partnerMoodDetails && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-xs shadow-inner">
                  <span className="text-zinc-400 font-medium">{partner?.name.split(' ')[0]}'s Mood:</span>
                  <span className="text-sm">{partnerMoodDetails.emoji}</span>
                  <span className={`font-semibold ${partnerMoodDetails.color}`}>{partnerMoodDetails.label}</span>
                </div>
              )}

              {/* Mood Check-In Trigger */}
              <button
                onClick={() => setIsMoodModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-all shadow-sm"
              >
                <Smile className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">My Mood</span>
                {activeMoodLog && <span className="text-sm">{getMoodDetails(activeMoodLog.mood).emoji}</span>}
              </button>

              {/* Dual-View Demo Partner Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg bg-zinc-900/90 border border-rose-500/20 hover:border-rose-500/40 text-xs text-zinc-200 transition-all"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-rose-500/50"
                  />
                  <span className="font-medium hidden md:inline">{currentUser.username || currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl p-2 z-50 border border-rose-500/30">
                    <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400">
                      <span>Account Menu</span>
                    </div>

                    <Link
                      href="/login"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors"
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

                    <div className="my-1 border-t border-zinc-800/80" />

                    <button
                      onClick={() => {
                        logoutUser();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <span>🚪 Reset / Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center space-x-1 border-t border-rose-500/10 px-3 py-2 bg-zinc-950/90 text-xs overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center py-1.5 px-3 rounded-lg flex-shrink-0 transition-colors ${
                  isActive ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Mood Check-In Modal */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl relative animate-in fade-in zoom-in duration-200">
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
