'use client';

import React from 'react';
import { Clock, Heart, Mail, Calendar, CheckSquare } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { useLoveLetters } from '@/lib/queries/useLoveLetters';
import { useBucketList } from '@/lib/queries/useBucketList';
import { LoveLetter } from '@/types';

export default function TimelinePage() {
  const { couple } = useLDRStore();
  const { data: loveLetters = [] } = useLoveLetters();
  const { data: bucketList = [] } = useBucketList();

  // Combine all items into a single unified chronological relationship timeline
  const timelineItems: Array<{
    id: string;
    type: 'letter' | 'anniversary' | 'bucket' | 'countdown';
    title: string;
    subtitle?: string;
    date: string;
    icon: any;
    color: string;
    bgColor: string;
  }> = [];

  // Add Relationship Start Date / Anniversary
  if (couple?.relationship_start_date) {
    timelineItems.push({
      id: 'tl-start',
      type: 'anniversary',
      title: 'The Journey Began ❤️',
      subtitle: 'Relationship start date',
      date: couple.relationship_start_date,
      icon: Heart,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20 border-border',
    });
  }

  // Add Love Letters
  loveLetters.forEach((letter: LoveLetter) => {
    timelineItems.push({
      id: `tl-${letter.id}`,
      type: 'letter',
      title: `Love Letter: ${letter.title}`,
      subtitle: letter.content.substring(0, 100) + (letter.content.length > 100 ? '...' : ''),
      date: letter.created_at,
      icon: Mail,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20 border-border',
    });
  });

  // Add Completed Bucket Items
  bucketList.filter((b) => b.completed).forEach((b) => {
    timelineItems.push({
      id: `tl-${b.id}`,
      type: 'bucket',
      title: `Milestone Unlocked: ${b.title}`,
      subtitle: b.description || 'Completed together',
      date: b.completed_at || b.created_at,
      icon: CheckSquare,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20 border-border',
    });
  });

  // Sort timeline chronologically (newest first)
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Clock className="w-8 h-8 text-rose-400" />
          <span>Relationship Timeline</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          An automated chronological story of your journey, letters, and milestones together.
        </p>
      </div>

      {/* Timeline Vertical Feed */}
      <div className="relative max-w-3xl mx-auto py-6">
        {/* Vertical Line Connector */}
        <div className="absolute left-5 sm:left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-rose-500/40 via-pink-500/20 to-purple-500/20" />

        <div className="space-y-6 sm:space-y-8">
          {timelineItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative flex items-start space-x-4 sm:space-x-6 group">
                
                {/* Timeline Icon Node */}
                <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 flex-shrink-0 ${item.bgColor}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} />
                </div>

                {/* Timeline Content Card */}
                <div className="flex-1 soft-card soft-card-hover rounded-2xl p-4 sm:p-5 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                      {formatDate(item.date)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 uppercase">
                      {item.type}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-300 leading-relaxed italic">{item.subtitle}</p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

