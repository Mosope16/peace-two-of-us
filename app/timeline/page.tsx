'use client';

import React from 'react';
import { Clock, Heart, ImageIcon, Mail, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { useLDRStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { useMemories } from '@/lib/queries/useMemories';
import { useLoveLetters } from '@/lib/queries/useLoveLetters';
import { useBucketList } from '@/lib/queries/useBucketList';

export default function TimelinePage() {
  const { couple } = useLDRStore();
  const { data: memories = [] } = useMemories();
  const { data: loveLetters = [] } = useLoveLetters();
  const { data: bucketList = [] } = useBucketList();

  // Combine all items into a single unified chronological relationship timeline
  const timelineItems: Array<{
    id: string;
    type: 'memory' | 'letter' | 'anniversary' | 'bucket' | 'countdown';
    title: string;
    subtitle?: string;
    date: string;
    icon: any;
    color: string;
    bgColor: string;
    imageUrl?: string;
  }> = [];

  // Add Relationship Start Date / Anniversary
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

  // Add Memories
  memories.forEach((mem) => {
    timelineItems.push({
      id: `tl-${mem.id}`,
      type: 'memory',
      title: mem.title,
      subtitle: mem.description,
      date: mem.date,
      icon: ImageIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20 border-blue-500/40',
      imageUrl: mem.image_url,
    });
  });

  // Add Love Letters
  loveLetters.forEach((letter) => {
    timelineItems.push({
      id: `tl-${letter.id}`,
      type: 'letter',
      title: `Love Letter: ${letter.title}`,
      subtitle: letter.content.substring(0, 100) + '...',
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
          An automated chronological story of your journey, memories, letters, and milestones together.
        </p>
      </div>

      {/* Timeline Vertical Feed */}
      <div className="relative max-w-3xl mx-auto py-6">
        {/* Vertical Line Connector */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 to-purple-500/20" />

        <div className="space-y-8">
          {timelineItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative flex items-start space-x-6 group">
                
                {/* Timeline Icon Node */}
                <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover:scale-110 ${item.bgColor}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>

                {/* Timeline Content Card */}
                <div className="flex-1 soft-card soft-card-hover rounded-2xl p-5 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
                      {formatDate(item.date)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 uppercase">
                      {item.type}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  {item.subtitle && (
                    <p className="text-xs text-zinc-300 leading-relaxed italic">{item.subtitle}</p>
                  )}

                  {item.imageUrl && (
                    <div className="rounded-xl overflow-hidden aspect-video max-h-48 mt-2 border border-zinc-800">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
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
