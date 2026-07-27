import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import confetti from "canvas-confetti";
import { MoodOption, MoodType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'loved', emoji: '❤️', label: 'Loved', color: 'text-rose-500', bgColor: 'bg-rose-500/10 border-rose-500/30' },
  { id: 'sad', emoji: '😔', label: 'Sad', color: 'text-blue-400', bgColor: 'bg-blue-400/10 border-blue-400/30' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'text-purple-400', bgColor: 'bg-purple-400/10 border-purple-400/30' },
  { id: 'missing_you', emoji: '😭', label: 'Missing You', color: 'text-pink-500', bgColor: 'bg-pink-500/10 border-pink-500/30' },
];

export function getMoodDetails(mood: MoodType) {
  return MOOD_OPTIONS.find((m) => m.id === mood) || MOOD_OPTIONS[0];
}

export function calculateDaysTogether(startDateStr: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateCountdownDays(targetDateStr: string): { days: number; hours: number; minutes: number; isPassed: boolean } {
  if (!targetDateStr) return { days: 0, hours: 0, minutes: 0, isPassed: true };
  const target = new Date(targetDateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isPassed: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isPassed: false };
}

export function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', options);
}

export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export function isLetterLocked(unlockDateStr?: string): boolean {
  if (!unlockDateStr) return false;
  const unlock = new Date(unlockDateStr);
  const now = new Date();
  return unlock.getTime() > now.getTime();
}

export function triggerLoveConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#fbbf24']
  });
}
