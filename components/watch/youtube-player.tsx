'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Maximize,
  Minimize,
} from 'lucide-react';
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
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const playerTargetRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      // ignore
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
    const playing =
      playerRef.current && typeof playerRef.current.getPlayerState === 'function'
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

  const handleReaction = useCallback(
    (reaction: string) => {
      onReactionTriggered?.(reaction);
    },
    [onReactionTriggered]
  );

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

  // Keep references stable for lifecycle effect to avoid player restarts
  const broadcastPlayRef = useRef(broadcastPlay);
  broadcastPlayRef.current = broadcastPlay;
  const broadcastPauseRef = useRef(broadcastPause);
  broadcastPauseRef.current = broadcastPause;
  const updatePlaybackMutationRef = useRef(updatePlaybackMutation);
  updatePlaybackMutationRef.current = updatePlaybackMutation;
  const safeGetCurrentTimeRef = useRef(safeGetCurrentTime);
  safeGetCurrentTimeRef.current = safeGetCurrentTime;
  const sessionInitialPosRef = useRef(session.current_position);

  // Track Fullscreen Change Events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Load and initialize YouTube Player
  useEffect(() => {
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !playerTargetRef.current || !window.YT?.Player) {
        return;
      }

      // Destroy previous instance if it exists
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      playerRef.current = null;
      setIsPlayerReady(false);
      setErrorMessage(null);

      try {
        const player = new window.YT.Player(playerTargetRef.current, {
          width: '100%',
          height: '100%',
          videoId: session.media_id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 0,
            controls: 1, // Standard interactive controls
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;

              console.log('[Peace Watch] YouTube player ready');
              playerRef.current = event.target;
              setIsPlayerReady(true);

              const durationVal = typeof event.target.getDuration === 'function' ? event.target.getDuration() : 0;
              if (durationVal > 0) {
                setDuration(durationVal);
              }

              if (sessionInitialPosRef.current > 0 && typeof event.target.seekTo === 'function') {
                event.target.seekTo(sessionInitialPosRef.current, true);
              }
            },

            onStateChange: (event: any) => {
              console.log('[Peace Watch] YouTube state:', event.data);
              const state = event.data;

              // YT.PlayerState: 1 = PLAYING
              if (state === 1) {
                setIsPlaying(true);

                if (!isApplyingRemoteAction.current) {
                  const pos = safeGetCurrentTimeRef.current();
                  broadcastPlayRef.current(pos);
                  updatePlaybackMutationRef.current.mutate({
                    sessionId: session.id,
                    position: pos,
                    isPlaying: true,
                  });
                }
              }

              // YT.PlayerState: 2 = PAUSED, 0 = ENDED
              if (state === 2 || state === 0) {
                setIsPlaying(false);

                if (!isApplyingRemoteAction.current) {
                  const pos = safeGetCurrentTimeRef.current();
                  broadcastPauseRef.current(pos);
                  updatePlaybackMutationRef.current.mutate({
                    sessionId: session.id,
                    position: pos,
                    isPlaying: false,
                  });
                }
              }
            },

            onError: (event: any) => {
              console.error('[Peace Watch] YouTube error:', event.data);

              switch (event.data) {
                case 2:
                  setErrorMessage('Invalid YouTube video ID.');
                  break;
                case 5:
                  setErrorMessage('HTML5 player error on this video.');
                  break;
                case 100:
                  setErrorMessage('This YouTube video was not found or has been removed.');
                  break;
                case 101:
                case 150:
                  setErrorMessage(
                    'This video does not allow embedded playback. Please choose another YouTube video.'
                  );
                  break;
                default:
                  setErrorMessage(`YouTube playback error (${event.data}).`);
              }
            },
          },
        });

        playerRef.current = player;
      } catch (error) {
        console.error('[Peace Watch] Failed to create YouTube player:', error);
        setErrorMessage('Unable to initialize the YouTube player.');
      }
    };

    const loadYouTubeAPI = () => {
      if (cancelled) return;

      if (window.YT?.Player) {
        createPlayer();
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (!cancelled) {
          createPlayer();
        }
      };
    };

    loadYouTubeAPI();

    return () => {
      cancelled = true;
      setIsPlayerReady(false);

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }

      playerRef.current = null;
    };
  }, [session.media_id, session.id]);

  // Track Playback Time, Presence, & Drift Calculation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || !isPlayerReady) return;

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
  }, [
    isPlayerReady,
    isPlaying,
    partnerPresence,
    session.id,
    updatePresence,
    setSyncStatus,
    setDriftSeconds,
    safeGetCurrentTime,
    safeGetDuration,
  ]);

  // Controls: Fullscreen Toggle
  const toggleFullscreen = () => {
    const el = playerWrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. VIDEO PLAYER WRAPPER */}
      <div
        ref={playerWrapperRef}
        className={`relative aspect-video w-full rounded-3xl overflow-hidden bg-black border border-border shadow-2xl [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 ${
          isFullscreen ? '!rounded-none !border-none !h-screen !w-screen !aspect-auto' : ''
        }`}
      >
        {/* Actual YouTube IFrame Host */}
        <div ref={playerTargetRef} className="absolute inset-0 w-full h-full" />

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

        {/* Sync Status Badge Overlay (Top-Right) */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 pointer-events-none">
          {partnerPresence ? (
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/30 border-amber-500/40 text-amber-300 animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>
                {syncStatus === 'synced' ? `Synced · ${driftSeconds}s` : 'Catching up...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-zinc-900/80 border border-zinc-700/60 text-zinc-300 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Waiting for partner</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. COMPACT PLAYER TOOLBAR & QUICK CONTROLS */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm shadow-md">
        <div className="flex items-center space-x-3 text-xs text-zinc-300">
          <span className="font-mono text-zinc-400 text-xs">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] text-zinc-400">
            {isPlaying ? '● Playing' : '❚❚ Paused'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Force Sync to Partner Button */}
          <button
            onClick={() => broadcastSyncRequest()}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-all hover:border-primary/50 shadow-sm active:scale-95"
            title="Force Sync with Partner"
          >
            <RotateCcw className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Sync to Partner</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            type="button"
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:border-primary/50 shadow-sm active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-primary" />
            ) : (
              <Maximize className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        </div>
      </div>

      {/* 3. QUICK REACTION BAR */}
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
