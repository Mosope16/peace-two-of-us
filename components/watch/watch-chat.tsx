'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useWatchMessages, useSendWatchMessage } from '@/lib/queries/useWatchTogether';
import { useLDRStore } from '@/lib/store';

interface WatchChatProps {
  sessionId: string;
}

export function WatchChat({ sessionId }: WatchChatProps) {
  const { data: messages = [], isLoading } = useWatchMessages(sessionId);
  const sendMessageMutation = useSendWatchMessage();
  const { currentUser, partner } = useLDRStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendMessageMutation.isPending) return;

    const text = inputText;
    setInputText('');
    sendMessageMutation.mutate({
      sessionId,
      message: text,
    });
  };

  return (
    <div className="flex flex-col h-[480px] rounded-3xl bg-surface border border-border overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Watch Chat</h4>
            <p className="text-[10px] text-zinc-400">Synced in real-time with {partner?.name.split(' ')[0] || 'partner'}</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-xs text-zinc-500">
            Loading messages...
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-2">
            <span className="text-3xl">🍿</span>
            <p className="text-xs text-zinc-400 font-medium">No messages yet</p>
            <p className="text-[11px] text-zinc-500">Send a thought or reaction while watching together!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <img
                  src={partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={partner?.name || 'Partner'}
                  className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-primary/40"
                />
              )}

              <div
                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-primary text-white rounded-br-none shadow-md'
                    : 'bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                }`}
              >
                <p className="break-words">{msg.message}</p>
              </div>

              {isMe && (
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name || 'Me'}
                  className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-primary/40"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-zinc-900/60 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Say something to ${partner?.name.split(' ')[0] || 'partner'}...`}
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-primary focus:outline-none text-xs text-white placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sendMessageMutation.isPending}
          className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
