'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Calendar, Mail, Gamepad2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8 px-4 sm:px-0">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-border text-rose-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Designed exclusively for 2 people in love</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          Keep your hearts connected across any <span className="text-gradient">distance</span>.
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          A private digital space for two. Exchange time-locked love letters, challenge each other in fun couple games &amp; IQ Duels, log daily moods, and count down to your next embrace.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
          >
            <span>Enter Couple Space</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6 px-4 sm:px-0">
        <div className="soft-card soft-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Couple Games &amp; Duels</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Play Know Me quizzes, duel in live timed IQ tests, and answer This-or-That prompts together in real-time.
          </p>
        </div>

        <div className="soft-card soft-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-border flex items-center justify-center text-pink-400">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Time-Locked Letters</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Write heartfelt letters sealed until special dates, like an upcoming anniversary, birthday, or reunion.
          </p>
        </div>

        <div className="soft-card soft-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-border flex items-center justify-center text-purple-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Visit &amp; Anniversary Tickers</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Watch the days, hours, and minutes count down together until your next airport embrace.
          </p>
        </div>
      </section>
    </div>
  );
}

