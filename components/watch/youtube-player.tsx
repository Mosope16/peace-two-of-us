'use client';

import React, { useCallback } from 'react';
import { WatchSession } from '@/types';
import { useLDRStore } from '@/lib/store';
import { useWatchSync } from '@/lib/watch/use-watch-sync';
import SyncYouTubePlayer from './sync-youtube-player';
import { useUpdateWatchPlayback } from '@/lib/queries/useWatchTogether';

interface YouTubePlayerProps {
  session: WatchSession;
  onReactionTriggered?: (reaction: string) => void;
  onChangeVideo?: () => void;
}

export function YouTubePlayer({
  session,
  onReactionTriggered,
  onChangeVideo,
}: YouTubePlayerProps) {
  const { currentUser, partner } = useLDRStore();
  const updatePlaybackMutation = useUpdateWatchPlayback();

  const { incomingEvent, partnerPresence, broadcast, updatePresenceState } = useWatchSync(
    session?.id,
    currentUser?.id
  );

  const handleStateChange = useCallback(
    ({ position, isPlaying }: { position: number; isPlaying: boolean }) => {
      // Update Presence heartbeat
      updatePresenceState({
        position,
        playerState: isPlaying ? 'playing' : 'paused',
      });

      // Infrequent durable update to Postgres for session recovery
      if (session?.id) {
        updatePlaybackMutation.mutate({
          sessionId: session.id,
          position,
          isPlaying,
        });
      }
    },
    [session?.id, updatePresenceState, updatePlaybackMutation]
  );

  if (!session?.media_id) {
    return null;
  }

  return (
    <SyncYouTubePlayer
      videoId={session.media_id}
      userId={currentUser?.id || 'unknown-user'}
      title={session.title}
      partnerName={partner?.name}
      partnerPresence={partnerPresence}
      incomingEvent={incomingEvent}
      onBroadcast={broadcast}
      onStateChange={handleStateChange}
      onReactionTriggered={onReactionTriggered}
      onChangeVideo={onChangeVideo}
    />
  );
}

export default YouTubePlayer;
