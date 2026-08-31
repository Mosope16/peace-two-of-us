'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import { WatchSession } from '@/types';
import { useWatchRealtimeEngine, useUpdateWatchPlayback } from '@/lib/queries/useWatchTogether';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  session: WatchSession;
  onReactionTriggered?: (reaction: string) => void;
}

export function YouTubePlayer({ session, onReactionTriggered }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suppression flag to prevent infinite remote action loops
  const isApplyingRemoteAction = useRef<boolean>(false);
  const updatePlaybackMutation = useUpdateWatchPlayback();

  // Helper safe callers
  const safeGetCurrentTime = useCallback(() => {
    try {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        return playerRef.current.getCurrentTime() || 0;
      }
    } catch {
      // ignore during iframe teardown
    }
    return 0;
  }, []);

  const safeGetDuration = useCallback(() => {
    try {
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        return playerRef.current.getDuration() || 0;
      }
    } catch {
      // ignore
    }
    return 0;
  }, []);

  // Realtime Callbacks
  const handleRemotePlay = useCallback((targetPos: number) => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    isApplyingRemoteAction.current = true;
    if (typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(targetPos, true);
    }
    playerRef.current.playVideo();
    setIsPlaying(true);
    setTimeout(() => {
      isApplyingRemoteAction.current = false;
    }, 400);
  }, []);

  const handleRemotePause = useCallback((targetPos: number) => {
    if (!playerRef.current || typeof playerRef.current.pauseVideo !== 'function') return;
    isApplyingRemoteAction.current = true;
    if (typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(targetPos, true);
    }
    playerRef.current.pauseVideo();
    setIsPlaying(false);
    setTimeout(() => {
      isApplyingRemoteAction.current = false;
    }, 400);
  }, []);

  const handleRemoteSeek = useCallback((targetPos: number) => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    isApplyingRemoteAction.current = true;
    playerRef.current.seekTo(targetPos, true);
    setCurrentTime(targetPos);
    setTimeout(() => {
      isApplyingRemoteAction.current = false;
    }, 400);
  }, []);

  const handleSyncRequest = useCallback(() => {
    const pos = safeGetCurrentTime();
    const playing = playerRef.current && typeof playerRef.current.getPlayerState === 'function'
      ? playerRef.current.getPlayerState() === 1
      : false;
    return { position: pos, isPlaying: playing };
  }, [safeGetCurrentTime]);

  const handleSyncResponse = useCallback((pos: number, playing: boolean) => {
    if (!playerRef.current) return;
    isApplyingRemoteAction.current = true;
    if (typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(pos, true);
    }
    if (playing && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
      setIsPlaying(true);
    } else if (!playing && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
    setTimeout(() => {
      isApplyingRemoteAction.current = false;
    }, 500);
  }, []);

  const handleVideoChanged = useCallback((newMediaId: string) => {
    if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') return;
    isApplyingRemoteAction.current = true;
    playerRef.current.loadVideoById(newMediaId);
    setTimeout(() => {
      isApplyingRemoteAction.current = false;
    }, 800);
  }, []);

  const handleReaction = useCallback((reaction: string) => {
    onReactionTriggered?.(reaction);
  }, [onReactionTriggered]);

  const handleSessionEnded = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  }, []);

  // Initialize Realtime Engine
  const {
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
    broadcastSyncRequest,
    broadcastReaction,
    updatePresence,
    partnerPresence,
    syncStatus,
    setSyncStatus,
    driftSeconds,
    setDriftSeconds,
  } = useWatchRealtimeEngine(session.id, {
    onPlay: handleRemotePlay,
    onPause: handleRemotePause,
    onSeek: handleRemoteSeek,
    onSyncRequest: handleSyncRequest,
    onSyncResponse: handleSyncResponse,
    onVideoChanged: handleVideoChanged,
    onReaction: handleReaction,
    onSessionEnded: handleSessionEnded,
  });

  // Load YouTube IFrame API Script
  useEffect(() => {
    let isCancelled = false;

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      if (!isCancelled) {
        initPlayer();
      }
    };

    function initPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player('peace-yt-player', {
        height: '100%',
        width: '100%',
        videoId: session.media_id,
        playerVars: {
          autoplay: 0,
          controls: 0, // Custom Peace controls for flawless sync
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            const dur = typeof event.target.getDuration === 'function' ? event.target.getDuration() : 0;
            if (dur > 0) setDuration(dur);
            if (session.current_position > 0 && typeof event.target.seekTo === 'function') {
              event.target.seekTo(session.current_position, true);
            }
          },
          onStateChange: (event: any) => {
            const playerState = event.data;
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (playerState === 1) {
              setIsPlaying(true);
              if (!isApplyingRemoteAction.current) {
                const pos = safeGetCurrentTime();
                broadcastPlay(pos);
                updatePlaybackMutation.mutate({
                  sessionId: session.id,
                  position: pos,
                  isPlaying: true,
                });
              }
            } else if (playerState === 2) {
              setIsPlaying(false);
              if (!isApplyingRemoteAction.current) {
                const pos = safeGetCurrentTime();
                broadcastPause(pos);
                updatePlaybackMutation.mutate({
                  sessionId: session.id,
                  position: pos,
                  isPlaying: false,
                });
              }
            }
          },
          onError: (event: any) => {
            const code = event.data;
            if (code === 101 || code === 150) {
              setErrorMessage('This YouTube video owner does not allow embedded playback. Please try another video URL.');
            } else if (code === 100) {
              setErrorMessage('YouTube video not found or removed.');
            } else {
              setErrorMessage('Playback error on YouTube video. Try another link.');
            }
          },
        },
      });
    }

    return () => {
      isCancelled = true;
      setIsPlayerReady(false);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [session.media_id, session.current_position, session.id, broadcastPlay, broadcastPause, updatePlaybackMutation, safeGetCurrentTime]);

  // Track Playback Time, Presence, & Drift Calculation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || !isPlayerReady) return;
      if (typeof playerRef.current.getCurrentTime !== 'function') return;

      const pos = safeGetCurrentTime();
      const dur = safeGetDuration();
      setCurrentTime(pos);
      if (dur > 0) setDuration(dur);

      // Presence heartbeat update
      const state = isPlaying ? 'watching' : 'paused';
      updatePresence(state, pos);

      // Drift Calculation against Partner Presence
      if (partnerPresence && partnerPresence.current_position !== undefined && isPlaying) {
        const drift = Math.abs(pos - partnerPresence.current_position);
        setDriftSeconds(parseFloat(drift.toFixed(2)));

        if (drift < 1.0) {
          setSyncStatus('synced');
          if (typeof playerRef.current.setPlaybackRate === 'function') {
            playerRef.current.setPlaybackRate(1.0);
          }
        } else if (drift >= 1.0 && drift <= 3.0) {
          setSyncStatus('catching_up');
          if (typeof playerRef.current.setPlaybackRate === 'function') {
            if (pos < partnerPresence.current_position) {
              playerRef.current.setPlaybackRate(1.05);
            } else {
              playerRef.current.setPlaybackRate(0.95);
            }
          }
        } else if (drift > 3.0 && !isApplyingRemoteAction.current) {
          // Major drift: hard seek to partner position
          isApplyingRemoteAction.current = true;
          if (typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(partnerPresence.current_position, true);
          }
          if (typeof playerRef.current.setPlaybackRate === 'function') {
            playerRef.current.setPlaybackRate(1.0);
          }
          setSyncStatus('synced');
          setTimeout(() => {
            isApplyingRemoteAction.current = false;
          }, 500);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying, partnerPresence, session.id, updatePresence, setSyncStatus, setDriftSeconds, safeGetCurrentTime, safeGetDuration]);

  // Local Controls
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    } else {
      if (typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(target, true);
      broadcastSeek(target);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      if (typeof playerRef.current.unMute === 'function') {
        playerRef.current.unMute();
      }
      setIsMuted(false);
    } else {
      if (typeof playerRef.current.mute === 'function') {
        playerRef.current.mute();
      }
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. VIDEO PLAYER CONTAINER */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-border shadow-2xl group">
        <div ref={containerRef} id="peace-yt-player" className="w-full h-full" />

        {/* Error Fallback Banner */}
        {errorMessage && (
          <div className="absolute inset-0 z-20 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-base">Video Unavailable</h4>
            <p className="text-xs text-zinc-400 max-w-sm">{errorMessage}</p>
          </div>
        )}

        {/* Sync Status Badge Overlay */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          {partnerPresence ? (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>
                {syncStatus === 'synced' ? `Synced · ${driftSeconds}s` : 'Catching up...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-zinc-900/80 border border-zinc-700/60 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Waiting for partner</span>
            </div>
          )}
        </div>

        {/* Custom Peace Floating Controls */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col space-y-2 opacity-95 group-hover:opacity-100 transition-opacity">
          {/* Progress Seek Bar */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"
          />

          <div className="flex items-center justify-between text-xs text-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-zinc-300 text-[11px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => broadcastSyncRequest()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-[11px] font-semibold text-zinc-200 transition-all hover:border-primary/50"
                title="Force Sync with Partner"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Sync to Partner</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. QUICK REACTION BAR */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs text-zinc-400">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium">React Together:</span>
        </div>

        <div className="flex items-center space-x-2">
          {['❤️', '😂', '🔥', '😍', '🍿', '🥺'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                broadcastReaction(emoji);
                onReactionTriggered?.(emoji);
              }}
              className="text-lg p-1.5 rounded-xl hover:bg-zinc-800 active:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
