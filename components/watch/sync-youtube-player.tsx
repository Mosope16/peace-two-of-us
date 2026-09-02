'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  AlertTriangle,
  Sparkles,
  Users,
  ExternalLink,
} from 'lucide-react';
import { WatchEvent, PlayerState, PartnerPresence } from '@/lib/watch/use-watch-sync';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SyncYouTubePlayerProps {
  videoId: string;
  userId: string;
  title?: string;
  partnerName?: string;
  partnerPresence?: PartnerPresence | null;
  incomingEvent?: WatchEvent | null;
  onBroadcast: (event: WatchEvent) => void;
  onStateChange?: (state: { position: number; isPlaying: boolean }) => void;
  onReactionTriggered?: (reaction: string) => void;
  onChangeVideo?: () => void;
}

export default function SyncYouTubePlayer({
  videoId,
  userId,
  title,
  partnerName,
  partnerPresence,
  incomingEvent,
  onBroadcast,
  onStateChange,
  onReactionTriggered,
  onChangeVideo,
}: SyncYouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Suppression flag to prevent infinite echo loops
  const applyingRemoteAction = useRef(false);
  const remoteActionTimeout = useRef<NodeJS.Timeout | null>(null);

  const [ready, setReady] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>('paused');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsHovered, setControlsHovered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Safe timeout helper to clear applyingRemoteAction
  const setRemoteActionFlag = useCallback((durationMs = 1200) => {
    applyingRemoteAction.current = true;
    if (remoteActionTimeout.current) {
      clearTimeout(remoteActionTimeout.current);
    }
    remoteActionTimeout.current = setTimeout(() => {
      applyingRemoteAction.current = false;
    }, durationMs);
  }, []);

  // Controls auto-hide logic
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (playerState === 'playing' && !controlsHovered) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [playerState, controlsHovered]);

  useEffect(() => {
    if (playerState !== 'playing' || controlsHovered) {
      setShowControls(true);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    } else {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }

    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [playerState, controlsHovered]);

  /*
   * Fullscreen listeners
   */
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

  /*
   * Load YouTube API and Instantiate Player
   */
  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !containerRef.current || playerRef.current) return;

      setErrorMessage(null);
      setReady(false);

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0, // Disable native YouTube controls: Peace owns the UI
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;
              playerRef.current = event.target;
              setReady(true);
              const dur = event.target.getDuration ? event.target.getDuration() : 0;
              if (dur > 0) setDuration(dur);
              event.target.setVolume(volume);
            },
            onStateChange: handlePlayerStateChange,
            onError: (event: any) => {
              console.warn('[Peace Watch] YouTube player event error code:', event.data);
              switch (event.data) {
                case 2:
                  setErrorMessage('Invalid YouTube video parameter or URL.');
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
                    'The owner of this video has disabled embedded playback outside YouTube. Please choose another video or open it directly.'
                  );
                  break;
                default:
                  setErrorMessage(`YouTube playback error (${event.data}).`);
              }
            },
          },
        });
      } catch (err) {
        console.error('[Peace Watch] Failed to construct player:', err);
        setErrorMessage('Unable to initialize the YouTube player.');
      }
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
      playerRef.current = null;
      setReady(false);
      if (remoteActionTimeout.current) clearTimeout(remoteActionTimeout.current);
    };
  }, [videoId]);

  /*
   * Local player state changes (Internal YouTube API events)
   */
  const handlePlayerStateChange = useCallback(
    (event: any) => {
      const player = event.target;
      let state: PlayerState = 'paused';

      if (event.data === window.YT.PlayerState.PLAYING) {
        state = 'playing';
      } else if (event.data === window.YT.PlayerState.BUFFERING) {
        state = 'buffering';
      } else if (event.data === window.YT.PlayerState.ENDED) {
        state = 'ended';
      }

      setPlayerState(state);

      const pos = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
      setCurrentTime(pos);

      onStateChange?.({
        position: pos,
        isPlaying: state === 'playing',
      });

      /*
       * Suppress broadcast if this state change was caused by a remote command
       */
      if (applyingRemoteAction.current) {
        return;
      }

      if (state === 'playing') {
        onBroadcast({
          type: 'PLAY',
          senderId: userId,
          position: pos,
          timestamp: Date.now(),
        });
      } else if (state === 'paused') {
        onBroadcast({
          type: 'PAUSE',
          senderId: userId,
          position: pos,
          timestamp: Date.now(),
        });
      }
    },
    [onBroadcast, userId, onStateChange]
  );

  /*
   * Process Incoming Remote Events (from Partner)
   */
  useEffect(() => {
    if (!incomingEvent) return;
    if (incomingEvent.senderId === userId) return;

    const player = playerRef.current;
    if (!player || !ready) return;

    switch (incomingEvent.type) {
      case 'PLAY': {
        setRemoteActionFlag(1200);
        const position = incomingEvent.position ?? 0;
        const currentPos = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;

        if (Math.abs(position - currentPos) > 1.5 && typeof player.seekTo === 'function') {
          player.seekTo(position, true);
        }
        if (typeof player.playVideo === 'function') {
          player.playVideo();
        }
        break;
      }

      case 'PAUSE': {
        setRemoteActionFlag(1200);
        const position = incomingEvent.position ?? 0;
        if (typeof player.seekTo === 'function') {
          player.seekTo(position, true);
        }
        if (typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
        break;
      }

      case 'SEEK': {
        // Fix for Bug 1: Ensure remote action flag is set and safely released after seek settles
        setRemoteActionFlag(1500);
        const position = incomingEvent.position ?? 0;
        if (typeof player.seekTo === 'function') {
          player.seekTo(position, true);
        }
        setCurrentTime(position);
        break;
      }

      case 'SYNC_REQUEST': {
        // Respond to partner with current authoritative state
        const currentPos = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
        const isCurrentlyPlaying =
          typeof player.getPlayerState === 'function' &&
          player.getPlayerState() === window.YT.PlayerState.PLAYING;

        onBroadcast({
          type: 'SYNC_RESPONSE',
          senderId: userId,
          position: currentPos,
          playerState: isCurrentlyPlaying ? 'playing' : 'paused',
          timestamp: Date.now(),
        });
        break;
      }

      case 'SYNC_RESPONSE': {
        setRemoteActionFlag(2000);
        setIsSyncing(false);
        const position = incomingEvent.position ?? 0;
        const localPosition = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
        const difference = position - localPosition;

        // Large difference: hard seek
        if (Math.abs(difference) > 3.5) {
          if (typeof player.seekTo === 'function') {
            player.seekTo(position, true);
          }
          setCurrentTime(position);
        }
        // Moderate difference: slightly change playback speed for a smooth catch-up
        else if (Math.abs(difference) > 1.2) {
          if (typeof player.setPlaybackRate === 'function') {
            if (difference > 0) {
              player.setPlaybackRate(1.05);
            } else {
              player.setPlaybackRate(0.95);
            }

            setTimeout(() => {
              try {
                if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
                  playerRef.current.setPlaybackRate(1.0);
                }
              } catch {}
            }, 3500);
          }
        }

        // Match playback state
        if (incomingEvent.playerState === 'playing') {
          player.playVideo();
        } else if (incomingEvent.playerState === 'paused') {
          player.pauseVideo();
        }
        break;
      }

      case 'REACTION': {
        if (incomingEvent.reaction) {
          onReactionTriggered?.(incomingEvent.reaction);
        }
        break;
      }
    }
  }, [incomingEvent, ready, userId, onBroadcast, onReactionTriggered, setRemoteActionFlag]);

  /*
   * Initial synchronization on room join (Bug 2 fix: fire once, not in an infinite loop)
   */
  useEffect(() => {
    if (!ready) return;

    const timeout = setTimeout(() => {
      onBroadcast({
        type: 'SYNC_REQUEST',
        senderId: userId,
        timestamp: Date.now(),
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [ready, userId, onBroadcast]);

  /*
   * Local continuous timeline progress updater
   */
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const pos = player.getCurrentTime() || 0;
      setCurrentTime(pos);

      const dur = typeof player.getDuration === 'function' ? player.getDuration() : 0;
      if (dur > 0 && dur !== duration) {
        setDuration(dur);
      }

      onStateChange?.({
        position: pos,
        isPlaying: player.getPlayerState?.() === window.YT.PlayerState.PLAYING,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [ready, duration, onStateChange]);

  /*
   * Playback Controls
   */
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
    if (state === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const seekRelative = (seconds: number) => {
    const player = playerRef.current;
    if (!player || typeof player.getCurrentTime !== 'function') return;

    const current = player.getCurrentTime();
    const newPosition = Math.max(0, Math.min(duration, current + seconds));

    player.seekTo(newPosition, true);
    setCurrentTime(newPosition);

    onBroadcast({
      type: 'SEEK',
      senderId: userId,
      position: newPosition,
      timestamp: Date.now(),
    });
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    const player = playerRef.current;

    if (player && typeof player.seekTo === 'function') {
      player.seekTo(newPosition, true);
    }
    setCurrentTime(newPosition);

    onBroadcast({
      type: 'SEEK',
      senderId: userId,
      position: newPosition,
      timestamp: Date.now(),
    });
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;

    if (muted) {
      player.unMute();
      player.setVolume(volume);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const player = playerRef.current;
    if (player) {
      if (val === 0) {
        player.mute();
        setMuted(true);
      } else {
        if (muted) {
          player.unMute();
          setMuted(false);
        }
        player.setVolume(val);
      }
    }
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
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

  const handleManualSync = () => {
    setIsSyncing(true);
    onBroadcast({
      type: 'SYNC_REQUEST',
      senderId: userId,
      timestamp: Date.now(),
    });
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* 1. MAIN PLAYER WRAPPER */}
      <div
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (playerState === 'playing') setShowControls(false);
        }}
        className={`relative aspect-video w-full overflow-hidden rounded-3xl bg-black border border-border shadow-2xl select-none transition-all ${
          isFullscreen ? '!rounded-none !border-none !h-screen !w-screen !aspect-auto' : ''
        }`}
      >
        {/* Actual YouTube IFrame Mounting Point */}
        <div ref={containerRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* Loading Overlay */}
        {!ready && !errorMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400 font-medium">Connecting to Watch Player...</p>
          </div>
        )}

        {/* Error Fallback Banner */}
        {errorMessage && (
          <div className="absolute inset-0 z-30 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-white font-bold text-base">Video Playback Blocked</h4>
              <p className="text-xs text-zinc-400">{errorMessage}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onChangeVideo && (
                <button
                  onClick={onChangeVideo}
                  className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:opacity-90 transition shadow-lg active:scale-95"
                >
                  Choose Another Video
                </button>
              )}
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center space-x-1.5 transition border border-zinc-700"
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}

        {/* Top Status Badges */}
        <div
          className={`absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Left: Video Title */}
          {title && (
            <div className="truncate max-w-xs sm:max-w-md bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/90 font-medium shadow-md">
              {title}
            </div>
          )}

          {/* Right: Partner Connection Status */}
          <div className="flex items-center space-x-2 ml-auto">
            {partnerPresence ? (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{partnerName ? `${partnerName.split(' ')[0]} watching` : 'Partner connected'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-zinc-900/80 border border-white/10 text-zinc-300 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span>Waiting for partner</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Play/Pause Trigger Overlay */}
        {ready && !errorMessage && playerState !== 'playing' && (
          <button
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-white"
            title="Play Video"
          >
            <Play size={32} fill="currentColor" className="ml-1" />
          </button>
        )}

        {/* Click anywhere on video to toggle play/pause */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-10 cursor-pointer"
          title={playerState === 'playing' ? 'Click to Pause' : 'Click to Play'}
        />

        {/* Bottom Controls Overlay */}
        <div
          onMouseEnter={() => setControlsHovered(true)}
          onMouseLeave={() => setControlsHovered(false)}
          className={`absolute inset-x-0 bottom-0 z-20 pointer-events-auto transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Subtle gradient backdrop */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

          <div className="px-4 pb-4 pt-10 space-y-2">
            {/* Scrubber Progress Bar */}
            <div className="relative group flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all"
                style={{
                  background: `linear-gradient(to right, var(--color-primary, #f43f5e) ${progressPercentage}%, rgba(255,255,255,0.2) ${progressPercentage}%)`,
                }}
              />
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between text-white text-xs pt-1">
              <div className="flex items-center space-x-3">
                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition text-white"
                  title={playerState === 'playing' ? 'Pause' : 'Play'}
                >
                  {playerState === 'playing' ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>

                {/* Back 10 Seconds */}
                <button
                  onClick={() => seekRelative(-10)}
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition text-zinc-300 hover:text-white"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Forward 10 Seconds */}
                <button
                  onClick={() => seekRelative(10)}
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition text-zinc-300 hover:text-white"
                  title="Forward 10 seconds"
                >
                  <RotateCw size={16} />
                </button>

                {/* Current Time / Total Duration */}
                <span className="font-mono text-[11px] text-zinc-300 select-none pl-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Volume & Mute */}
                <div className="flex items-center space-x-1 group/volume">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-xl hover:bg-white/10 transition text-zinc-300 hover:text-white"
                    title={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hidden sm:block group-hover/volume:opacity-100 transition-opacity"
                  />
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition text-zinc-300 hover:text-white"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PLAYER TOOLBAR & QUICK SYNC BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm gap-3">
        <div className="flex items-center space-x-3 text-xs text-zinc-300">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                playerState === 'playing' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span className="font-semibold text-white">
              {playerState === 'playing' ? 'Playing' : 'Paused'}
            </span>
          </div>

          <span className="text-zinc-600">|</span>

          <span className="font-mono text-zinc-400 text-xs">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Manual Sync to Partner Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-all hover:border-primary/50 shadow-sm active:scale-95 disabled:opacity-50"
            title="Sync playback position and state with your partner"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Partner'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            type="button"
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all hover:border-primary/50 shadow-sm active:scale-95"
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

      {/* 3. ROMANTIC REACTION BAR */}
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
                onBroadcast({
                  type: 'REACTION',
                  senderId: userId,
                  reaction: emoji,
                  timestamp: Date.now(),
                });
                onReactionTriggered?.(emoji);
              }}
              className="text-lg p-1.5 rounded-xl hover:bg-zinc-800 active:scale-125 transition-transform"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

